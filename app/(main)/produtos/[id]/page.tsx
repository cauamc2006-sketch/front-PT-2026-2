"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, use, useEffect, useState, useSyncExternalStore } from "react";
import CardProduto from "@/app/components/CardProduto";
import ModalCriarAvaliacao from "@/app/components/ModalCriarAvaliacao";
import ProductImageCard from "@/app/components/ProductImageCard";
import { readSession, subscribeSession } from "@/lib/session";
import { avaliacoesProdutoApi, formatPrice, produtosApi, StockioApiError, type AvaliacaoProduto, type Product } from "@/lib/stockio-api";
import { ModalEditarProduto } from "../../../components/ModalEditarProduto";

type Resultado<T> = { dados: T } | { erro: string };

function mensagemDeErro(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível carregar os dados.";
}

function Loading() {
  return <p className="mx-auto max-w-7xl px-6 py-16" role="status">Carregando produto...</p>;
}

function DetalhesProduto({ id }: { id: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const [resultado, setResultado] = useState<Resultado<Product>>();
  const [relacionados, setRelacionados] = useState<Resultado<Product[]>>();
  const [avaliacoes, setAvaliacoes] = useState<Resultado<AvaliacaoProduto[]>>();
  const [atualizacaoAvaliacoes, setAtualizacaoAvaliacoes] = useState(0);
  const [tentativa, setTentativa] = useState(0);
  const [editando, setEditando] = useState(false);
  const [aviso, setAviso] = useState("");
  const usuarioId = useSyncExternalStore(subscribeSession, () => readSession()?.userId ?? null, () => null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    produtosApi.buscar(id, signal).then((produto) => {
      if (signal.aborted) return;
      setResultado({ dados: produto });

      if (produto.lojaId === undefined) {
        setRelacionados({ dados: [] });
        return;
      }

      return produtosApi.listar(signal, produto.lojaId).then((items) => {
        if (!signal.aborted) {
          setRelacionados({ dados: items.filter(item => item.id !== id && item.ativo !== false) });
        }
      }).catch(() => {
        if (!signal.aborted) setRelacionados({ erro: "Não foi possível carregar os produtos da loja." });
      });
    }).catch((error: unknown) => {
      if (!signal.aborted) {
        setResultado({ erro: error instanceof StockioApiError && error.status === 404
          ? "Produto não encontrado." : mensagemDeErro(error) });
      }
    });

    return () => controller.abort();
  }, [id, tentativa]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    avaliacoesProdutoApi.listar({ produtoId: id }, signal).then((itens) => {
      if (!signal.aborted) setAvaliacoes({ dados: itens });
    }).catch(() => {
      if (!signal.aborted) setAvaliacoes({ erro: "Avaliações indisponíveis." });
    });

    return () => controller.abort();
  }, [id, tentativa, atualizacaoAvaliacoes]);

  if (!resultado) return <Loading />;
  if ("erro" in resultado) {
    return <div className="mx-auto max-w-7xl px-6 py-16">
      <p role="alert">{resultado.erro}</p>
      <div className="mt-4 flex gap-5 text-brand">
        <Link href="/produtos" className="underline">Ver produtos</Link>
        <button type="button" className="underline" onClick={() => {
          setResultado(undefined);
          setTentativa(value => value + 1);
        }}>Tentar novamente</button>
      </div>
    </div>;
  }

  const produto = resultado.dados;
  const podeEditar = usuarioId !== null && usuarioId === produto.loja?.usuarioId;
  const lojaHref = produto.lojaId === undefined ? undefined : `/lojas/${produto.lojaId}`;
  const disponivel = produto.ativo !== false && produto.estoque > 0;
  const notas = avaliacoes && "dados" in avaliacoes ? avaliacoes.dados : null;
  const total = notas?.length ?? 0;
  const media = notas?.length ? notas.reduce((soma, item) => soma + item.nota, 0) / notas.length : 0;
  const jaAvaliou = notas?.some((item) => item.usuarioId === usuarioId);
  const avaliando = params.get("avaliar") === "1";
  const rotaProduto = `/produtos/${id}`;
  const paramsAvaliacao = new URLSearchParams(params.toString());
  paramsAvaliacao.set("avaliar", "1");

  function fecharAvaliacao() {
    const restantes = new URLSearchParams(params.toString());
    restantes.delete("avaliar");
    router.replace(restantes.size ? `${rotaProduto}?${restantes}` : rotaProduto, { scroll: false });
  }
  const logo = produto.loja?.logoUrl?.trim();
  const selo = logo && lojaHref ? (
    <Link href={lojaHref} aria-label={`Ver loja ${produto.loja?.nome ?? ""}`.trim()}
      className="relative block size-12 overflow-hidden rounded-full bg-white ring-1 ring-ink/10 focus-visible:outline-2 focus-visible:outline-brand md:size-[4.5rem]">
      <Image src={logo} alt="" fill unoptimized className="object-cover" />
    </Link>
  ) : undefined;

  return (
    <div className="mx-auto max-w-[80rem] px-5 pt-8 pb-16 md:px-8 md:pt-[3.75rem]">
      <div className="grid gap-5 md:grid-cols-[2rem_minmax(0,1fr)] md:gap-6">
        <Link href="/produtos" aria-label="Voltar para produtos"
          className="grid size-9 place-items-center rounded-full hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-brand md:mt-3">
          <span aria-hidden="true" className="block size-4 rotate-45 border-b-2 border-l-2" />
        </Link>
        <div className="grid min-w-0 items-start gap-7 lg:grid-cols-[minmax(0,1.68fr)_minmax(0,1fr)]">
          <ProductImageCard name={produto.nome} images={produto.imagens} layout="detail" badge={selo} />
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-4xl leading-none font-medium break-words md:text-[2.5rem]">{produto.nome}</h1>
              {podeEditar && (
                <button type="button" aria-label="Editar produto" onClick={() => { setAviso(""); setEditando(true); }}
                  className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-brand text-white hover:bg-brand/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                  <Image src="/lojas/caneta.svg" alt="" width={16} height={16} />
                </button>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-base">
              {total > 0 ? (
                <a href="#avaliacoes-produto" className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-brand">
                  <span aria-hidden="true" className="text-amber-600">★ </span>
                  {media.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                  <span className="text-ink/70"> | {total} {total === 1 ? "avaliação" : "avaliações"}</span>
                </a>
              ) : (
                <span className="text-ink/70">{avaliacoes && "erro" in avaliacoes ? avaliacoes.erro : notas ? "Sem avaliações" : "Carregando avaliações…"}</span>
              )}
              {produto.categoria?.slug && <Link className="text-brand hover:underline" href={`/categoria/${encodeURIComponent(produto.categoria.slug)}`}>{produto.categoria.nome}</Link>}
              {!podeEditar && !jaAvaliou && (
                <Link
                  href={usuarioId === null ? "/login" : `${rotaProduto}?${paramsAvaliacao}`}
                  scroll={usuarioId === null}
                  className="text-brand hover:underline"
                >
                  Avaliar
                </Link>
              )}
              <span className={disponivel ? "text-brand" : "text-ink/70"}>
                {disponivel ? `${produto.estoque} ${produto.estoque === 1 ? "disponível" : "disponíveis"}` : "Indisponível"}
              </span>
            </div>
            <p className="mt-3 text-4xl font-medium">{formatPrice(produto.preco)}</p>

            <section className="mt-6" aria-labelledby="descricao-produto">
              <h2 id="descricao-produto" className="text-xl font-medium">Descrição</h2>
              <div aria-hidden="true" className="mb-2 h-0.5 w-5 rounded bg-ink/25" />
              <p className="text-base leading-snug break-words whitespace-pre-line">{produto.descricao?.trim() || "Este produto ainda não tem descrição."}</p>
            </section>
            {jaAvaliou && (
              <p className="mt-5 text-ink/70">Você já avaliou este produto.</p>
            )}
            {aviso && <p role="status" className="mt-4 text-green-800">{aviso}</p>}
          </div>
        </div>
      </div>

      <section className="mt-12" aria-labelledby="avaliacoes-produto">
        <h2 id="avaliacoes-produto" className="mb-5 scroll-mt-6 text-3xl font-medium md:text-4xl">
          Avaliações do produto
        </h2>
        {!avaliacoes ? (
          <p role="status">Carregando avaliações...</p>
        ) : "erro" in avaliacoes ? (
          <p role="alert">{avaliacoes.erro}</p>
        ) : avaliacoes.dados.length === 0 ? (
          <p className="text-ink/70">Este produto ainda não tem avaliações.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {avaliacoes.dados.map((avaliacao) => {
              const autor = avaliacao.usuario?.nome?.trim() || avaliacao.usuario?.username || "Cliente";

              return (
                <li key={avaliacao.id} className="flex min-w-0 flex-col rounded-3xl bg-white p-5 ring-1 ring-ink/10 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="min-w-0 break-words text-lg font-medium">{autor}</h3>
                    <span className="shrink-0 font-medium" aria-label={`${avaliacao.nota} de 5 estrelas`}>
                      <span aria-hidden="true" className="text-amber-600">★ </span>
                      {avaliacao.nota}/5
                    </span>
                  </div>
                  {avaliacao.comentario?.trim() && (
                    <p className="mt-3 whitespace-pre-wrap break-words text-ink/80">{avaliacao.comentario}</p>
                  )}
                  <div className="mt-auto pt-4">
                    <Link
                      href={`/comentarios?avaliacaoProdutoId=${avaliacao.id}`}
                      aria-label={`Ver comentários da avaliação de ${autor}`}
                      className="rounded-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-brand"
                    >
                      Ver comentários
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-12" aria-labelledby="mesma-loja">
        <h2 id="mesma-loja" className="mb-5 text-3xl font-medium md:text-4xl">Da mesma loja</h2>
        {!relacionados ? <p role="status">Carregando produtos da loja...</p> : "erro" in relacionados ? (
          <p role="alert">{relacionados.erro}</p>
        ) : relacionados.dados.length === 0 ? <p>Esta loja ainda não tem outros produtos disponíveis.</p> : (
          <ul className="flex snap-x gap-5 overflow-x-auto px-0.5 pt-0.5 pb-4 md:gap-8">
            {relacionados.dados.map(item => (
              <li key={item.id} className="w-44 shrink-0 snap-start md:w-[220px]">
                <CardProduto
                  produtoId={item.id}
                  nome={item.nome}
                  preco={formatPrice(item.preco)}
                  lojaLogo={produto.loja?.logoUrl}
                  imagemUrl={[...(item.imagens ?? [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))[0]?.urlImagem}
                  disponivel={item.estoque > 0}
                  statusLayout="stack"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {usuarioId !== null && !podeEditar && !jaAvaliou && avaliando && (
        <ModalCriarAvaliacao
          isOpen
          nome={produto.nome}
          rotuloComentario="Avaliação do produto (opcional)"
          onClose={fecharAvaliacao}
          onSubmit={async (dados) => {
            const criada = await avaliacoesProdutoApi.criar({ produtoId: id, ...dados });
            setAvaliacoes((atuais) => {
              if (!atuais || "erro" in atuais || atuais.dados.some((item) => item.id === criada.id)) {
                return atuais;
              }
              return { dados: [criada, ...atuais.dados] };
            });
            setAtualizacaoAvaliacoes((valor) => valor + 1);
            setAviso("Avaliação publicada com sucesso.");
          }}
        />
      )}

      {podeEditar && editando && (
        <ModalEditarProduto
          produto={produto}
          onClose={() => setEditando(false)}
          onUpdate={atualizado => setResultado({ dados: atualizado })}
          onSave={() => { setEditando(false); setAviso("Produto atualizado."); }}
          onDelete={() => router.replace(lojaHref ?? "/produtos")}
        />
      )}
    </div>
  );
}

function ProdutoDaRota({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const produtoId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(produtoId) || produtoId < 1 || produtoId > 2147483647) {
    return <div className="mx-auto max-w-7xl px-6 py-16">
      <p role="alert">Produto não encontrado.</p>
      <Link href="/produtos" className="mt-4 inline-block text-brand underline">Ver produtos</Link>
    </div>;
  }
  return <DetalhesProduto key={produtoId} id={produtoId} />;
}

export default function ProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<Loading />}><ProdutoDaRota params={params} /></Suspense>;
}
