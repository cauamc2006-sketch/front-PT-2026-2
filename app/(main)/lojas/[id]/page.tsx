"use client";

import { Suspense, use, useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import CardProduto from "@/app/components/CardProduto";
import { readSession } from "@/lib/session";
import {
	lojasApi,
	avaliacoesLojaApi,
	avaliacoesProdutoApi,
	produtosApi,
	formatPrice,
	type Loja,
	type AvaliacaoLoja,
	type AvaliacaoProduto,
	type Product,
} from "@/lib/stockio-api";

const PRODUTOS_POR_PAGINA = 15;

function useDragScroll() {
	const [arrastando, setArrastando] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const dragInfo = useRef({ ativo: false, startX: 0, scrollLeft: 0 });

	function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
		const container = containerRef.current;
		if (!container) return;
		dragInfo.current = {
			ativo: true,
			startX: e.pageX - container.offsetLeft,
			scrollLeft: container.scrollLeft,
		};
		setArrastando(true);
	}

	function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
		const container = containerRef.current;
		if (!dragInfo.current.ativo || !container) return;
		e.preventDefault();
		const x = e.pageX - container.offsetLeft;
		container.scrollLeft = dragInfo.current.scrollLeft - (x - dragInfo.current.startX);
	}

	function encerrar() {
		dragInfo.current.ativo = false;
		setArrastando(false);
	}

	return {
		ref: containerRef,
		arrastando,
		handlers: {
			onMouseDown,
			onMouseMove,
			onMouseUp: encerrar,
			onMouseLeave: encerrar,
		},
	};
}

function Estrela({ tipo }: { tipo: "cheia" | "meia" | "vazia" }) {
	if (tipo === "meia") {
		return (
			<Image
				src="/lojas/estrela-metade.svg"
				alt=""
				width={67}
				height={65}
				aria-hidden="true"
			/>
		);
	}

	return (
		<Image
			src="/lojas/estrela-cheia.svg"
			alt=""
			width={57}
			height={56}
			aria-hidden="true"
			className={tipo === "vazia" ? "opacity-20 grayscale" : ""}
		/>
	);
}

function LojaEspecificaConteudo({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const [loja, setLoja] = useState<Loja | null>(null);
	const [avaliacoes, setAvaliacoes] = useState<AvaliacaoLoja[]>([]);
	const [avaliacoesProdutos, setAvaliacoesProdutos] = useState<AvaliacaoProduto[]>([]);
	const [produtos, setProdutos] = useState<Product[]>([]);
	const [paginaAtual, setPaginaAtual] = useState(1);
	const [verTodasAvaliacoes, setVerTodasAvaliacoes] = useState(false);
	const [carregando, setCarregando] = useState(true);
	const [erro, setErro] = useState<string | null>(null);

	const reviewsScroll = useDragScroll();
	const melhorAvaliadosScroll = useDragScroll();

	const sessao = readSession();
	const estaLogado = Boolean(sessao);
	const isDono = Boolean(loja && sessao?.userId === loja.usuarioId);
	const nomeDono =
		loja?.usuario?.nome ||
		loja?.usuario?.username ||
		(loja ? `Usuário #${loja.usuarioId}` : "");
	const mediaNotas =
		avaliacoes.length > 0
			? avaliacoes.reduce((acc, item) => acc + item.nota, 0) / avaliacoes.length
			: 0;
	const mediaLimitada = Math.max(0, Math.min(5, mediaNotas));
	const estrelasCheias = Math.floor(mediaLimitada);
	const temMeiaEstrela = mediaLimitada - estrelasCheias >= 0.5;

	const somaPorProduto = new Map<number, { total: number; qtd: number }>();
	for (const av of avaliacoesProdutos) {
		const atual = somaPorProduto.get(av.produtoId) ?? { total: 0, qtd: 0 };
		atual.total += av.nota;
		atual.qtd += 1;
		somaPorProduto.set(av.produtoId, atual);
	}

	const produtosMelhorAvaliados = [...produtos].sort((a, b) => {
		const statsA = somaPorProduto.get(a.id);
		const statsB = somaPorProduto.get(b.id);
		const mediaA = statsA ? statsA.total / statsA.qtd : -1;
		const mediaB = statsB ? statsB.total / statsB.qtd : -1;
		return mediaB - mediaA;
	});

	const totalPaginas = Math.max(1, Math.ceil(produtos.length / PRODUTOS_POR_PAGINA));
	const indiceInicial = (paginaAtual - 1) * PRODUTOS_POR_PAGINA;
	const produtosExibidos = produtos.slice(indiceInicial, indiceInicial + PRODUTOS_POR_PAGINA);

	function irParaPagina(novaPagina: number) {
		if (novaPagina >= 1 && novaPagina <= totalPaginas) {
			setPaginaAtual(novaPagina);
		}
	}

	useEffect(() => {
		let ativo = true;
		const idLoja = Number(id);

		if (!id || !Number.isInteger(idLoja) || idLoja < 1) {
			setErro("ID de loja inválido.");
			setCarregando(false);
			return;
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000);

		Promise.all([
			lojasApi.buscar(idLoja),
			avaliacoesLojaApi.listar({ lojaId: idLoja }).catch(() => []),
			produtosApi.listar(controller.signal, idLoja).catch(() => []),
			avaliacoesProdutoApi.listar().catch(() => []),
		])
			.then(([dadosLoja, dadosAvaliacoes, dadosProdutos, dadosAvaliacoesProdutos]) => {
				if (ativo) {
					setLoja(dadosLoja);
					setAvaliacoes(dadosAvaliacoes);
					setProdutos(dadosProdutos);
					setAvaliacoesProdutos(dadosAvaliacoesProdutos);
					setPaginaAtual(1);
					setCarregando(false);
				}
			})
			.catch((e: unknown) => {
				if (ativo) {
					const mensagem =
						e instanceof Error ? e.message : "Erro ao carregar a loja.";
					setErro(mensagem);
					setCarregando(false);
				}
			})
			.finally(() => {
				clearTimeout(timeoutId);
			});

		return () => {
			ativo = false;
			clearTimeout(timeoutId);
			controller.abort();
		};
	}, [id]);

	if (carregando) {
		return (
			<div className="min-h-screen bg-black flex items-center justify-center text-white text-xl">
				Carregando loja...
			</div>
		);
	}

	if (erro || !loja) {
		return (
			<div className="min-h-screen bg-black flex items-center justify-center text-red-500 text-xl">
				{erro || "Loja não encontrada."}
			</div>
		);
	}

	return (
		<main className="min-h-screen">
			{/* SEÇÃO 1: HERO / BANNER */}
			<section className="relative w-full h-[500px] flex flex-col justify-center items-center overflow-hidden">
				<div className="absolute inset-0 z-0">
					<Image
						src={loja.bannerUrl || loja.logoUrl || "/stock-profile/logo-reference.svg"}
						alt={loja.nome}
						fill
						className="object-cover opacity-60"
						unoptimized
					/>
					<div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/90"></div>
				</div>

				<div className="relative z-10 text-center text-white mt-20">
					<h1 className="text-6xl font-semibold mb-2">{loja.nome}</h1>
					<p className="text-xl font-light text-gray-300 max-w-2xl">
						{loja.descricao || "Loja parceira Stock.io"}
					</p>
				</div>

				{isDono && (
					<div className="absolute top-10 right-10 z-20 flex flex-col gap-3">
						<button className="w-10 h-10 bg-[#8854ff] rounded-full flex items-center justify-center hover:opacity-80 transition text-white">
							✏️
						</button>
						<button className="w-10 h-10 bg-[#8854ff] rounded-full flex items-center justify-center hover:opacity-80 transition text-white text-2xl">
							+
						</button>
					</div>
				)}

				<p className="absolute bottom-6 right-10 z-20 text-lg font-light text-white">
					by{" "}
					<Link
						href={`/perfil?usuarioId=${loja.usuarioId}`}
						className="underline underline-offset-4 hover:text-[#C4B5FD] transition-colors"
					>
						{nomeDono}
					</Link>
				</p>
			</section>

			{/* SEÇÃO 2: REVIEWS */}
			<section className="bg-black pt-12 pb-20 px-16 text-white text-center">
				<h2 className="text-4xl font-medium mb-4">Reviews e Comentários</h2>

				{avaliacoes.length > 0 && (
					<div className="flex flex-col items-center justify-center mb-8">
						<span className="text-4xl font-normal text-white mb-2">
							{mediaNotas.toFixed(2).replace(".", ",")}
						</span>
						<div
							className="flex items-center justify-center gap-1.5"
							aria-label={`Nota média ${mediaNotas.toFixed(2).replace(".", ",")} de 5`}
						>
							{[0, 1, 2, 3, 4].map((indice) => {
								const tipo =
									indice < estrelasCheias
										? "cheia"
										: indice === estrelasCheias && temMeiaEstrela
											? "meia"
											: "vazia";
								return <Estrela key={indice} tipo={tipo} />;
							})}
						</div>
					</div>
				)}

				{avaliacoes.length > 0 && (
					<div className="flex justify-end mb-6">
						<button
							type="button"
							onClick={() => setVerTodasAvaliacoes((prev) => !prev)}
							className="bg-transparent text-[#8854ff] text-xl font-medium cursor-pointer hover:underline"
						>
							{verTodasAvaliacoes ? "ver menos" : "ver mais"}
						</button>
					</div>
				)}

				{verTodasAvaliacoes && estaLogado && (
					<div className="flex justify-center mb-10">
						<button
							type="button"
							className="w-max rounded-full bg-[#6A38F3] text-white px-8 py-3 text-lg font-medium cursor-pointer hover:opacity-90 transition-opacity"
						>
							Adicionar Review
						</button>
					</div>
				)}

				{avaliacoes.length === 0 ? (
					<p className="text-gray-400">
						Esta loja ainda não possui avaliações.
					</p>
				) : (
					<div
						ref={verTodasAvaliacoes ? undefined : reviewsScroll.ref}
						{...(verTodasAvaliacoes ? {} : reviewsScroll.handlers)}
						className={
							verTodasAvaliacoes
								? "w-full flex flex-col items-center gap-6"
								: `w-full flex gap-6 overflow-x-auto select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
										reviewsScroll.arrastando ? "cursor-grabbing" : "cursor-grab"
									}`
						}
					>
						{avaliacoes.map((avaliacao) => {
							const nota = Math.max(0, Math.min(5, Math.round(avaliacao.nota)));
							const estrelas = `${"★".repeat(nota)}${"☆".repeat(5 - nota)}`;
							const nomeAutor =
								avaliacao.usuario?.nome ||
								avaliacao.usuario?.username ||
								`Usuário #${avaliacao.usuarioId}`;

							return (
								<div
									key={avaliacao.id}
									className={`bg-[#F6F3E4] text-black min-h-[200px] rounded-[36px] p-10 pb-12 flex items-center gap-8 text-left relative ${
										verTodasAvaliacoes ? "w-full max-w-[900px]" : "w-[900px] flex-shrink-0"
									}`}
								>
									<div className="w-40 h-40 relative rounded-full overflow-hidden flex-shrink-0 bg-gray-300">
										<Image
											src={avaliacao.usuario?.fotoPerfilUrl || "/stock-profile/avatar-reference.svg"}
											alt={nomeAutor}
											fill
											className="object-cover"
											unoptimized
										/>
									</div>

									<div className="flex-1">
										<div className="flex justify-between items-center mb-3">
											<h4 className="font-semibold text-3xl">{nomeAutor}</h4>
											<span className="text-5xl text-[#FFEB3A] tracking-widest">{estrelas}</span>
										</div>
										<p className="text-black-600 font-light text-3xl leading-relaxed line-clamp-4 mb-2">
											{avaliacao.comentario || "Sem comentário."}
										</p>
									</div>

									<button
										type="button"
										className="absolute bottom-5 right-8 text-[#6A38F3] text-base font-medium cursor-pointer hover:underline"
									>
										ver mais
									</button>
								</div>
							);
						})}
					</div>
				)}
			</section>

			{/* SEÇÃO 3: PRODUTOS */}
			{!verTodasAvaliacoes && (
				<section className="bg-[#F6F3E4] py-16 px-16 space-y-16">
				<div>
					<div className="flex justify-between items-end mb-8">
						<h2 className="text-3xl font-bold text-black">
							Produtos <span className="font-light text-xl">melhor avaliados</span>
						</h2>
					</div>

					{produtosMelhorAvaliados.length === 0 ? (
						<p className="text-gray-500">
							Esta loja ainda não possui produtos cadastrados.
						</p>
					) : (
						<div
							ref={melhorAvaliadosScroll.ref}
							{...melhorAvaliadosScroll.handlers}
							className={`w-full flex gap-12 overflow-x-auto select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
								melhorAvaliadosScroll.arrastando ? "cursor-grabbing" : "cursor-grab"
							}`}
						>
							{produtosMelhorAvaliados.map((produto) => (
								<div key={produto.id} className="w-[220px] flex-shrink-0">
									<CardProduto
										imagemUrl={produto.imagens?.[0]?.urlImagem}
										nome={produto.nome}
										preco={formatPrice(produto.preco)}
										lojaLogo={loja.logoUrl}
										disponivel={produto.estoque > 0 && produto.ativo !== false}
									/>
								</div>
							))}
						</div>
					)}
				</div>

				<div>
					<div className="flex justify-between items-end mb-8">
						<h2 className="text-3xl font-bold text-black">
							Produtos <span className="font-light text-xl">de {loja.nome}</span>
						</h2>
					</div>

					{produtos.length === 0 ? (
						<p className="text-gray-500">
							Esta loja ainda não possui produtos cadastrados.
						</p>
					) : (
						<>
							<div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 gap-y-12 mb-16">
								{produtosExibidos.map((produto) => (
									<CardProduto
										key={produto.id}
										imagemUrl={produto.imagens?.[0]?.urlImagem}
										nome={produto.nome}
										preco={formatPrice(produto.preco)}
										lojaLogo={loja.logoUrl}
										disponivel={produto.estoque > 0 && produto.ativo !== false}
									/>
								))}
							</div>

							{totalPaginas > 1 && (
								<div className="flex justify-center items-center gap-6 text-2xl font-light text-black">
									<button
										onClick={() => irParaPagina(paginaAtual - 1)}
										disabled={paginaAtual === 1}
										className="hover:text-[#6A38F3] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
									>
										&lt;
									</button>

									{Array.from({ length: totalPaginas }).map((_, index) => {
										const numeroDaPagina = index + 1;
										return (
											<button
												key={numeroDaPagina}
												onClick={() => irParaPagina(numeroDaPagina)}
												className={`hover:text-[#6A38F3] transition-colors ${
													paginaAtual === numeroDaPagina ? "font-bold text-3xl" : ""
												}`}
											>
												{numeroDaPagina}
											</button>
										);
									})}

									<button
										onClick={() => irParaPagina(paginaAtual + 1)}
										disabled={paginaAtual === totalPaginas}
										className="hover:text-[#6A38F3] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
									>
										&gt;
									</button>
								</div>
							)}
						</>
					)}
				</div>
			</section>
			)}
		</main>
	);
}

export default function LojaEspecifica({ params }: { params: Promise<{ id: string }> }) {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-black flex items-center justify-center text-white text-xl">
					Carregando loja...
				</div>
			}
		>
			<LojaEspecificaConteudo params={params} />
		</Suspense>
	);
}
