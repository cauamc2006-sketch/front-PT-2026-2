"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, use, useEffect, useState, useSyncExternalStore } from "react";
import CardProduto from "@/app/components/CardProduto";
import ProductImageCard from "@/app/components/ProductImageCard";
import { readSession, subscribeSession } from "@/lib/session";
import { avaliacoesProdutoApi, formatPrice, produtosApi, StockioApiError, type Product } from "@/lib/stockio-api";
import { ModalEditarProduto } from "../../../components/ModalEditarProduto";

type Resultado<T> = { dados: T } | { erro: string };
type Resumo = { media: number; total: number };

function mensagemDeErro(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível carregar os dados.";
}

function Loading() {
  return <p className="mx-auto max-w-7xl px-6 py-16" role="status">Carregando produto...</p>;
}

function DetalhesProduto({ id }: { id: number }) {
  const router = useRouter();
  const [resultado, setResultado] = useState<Resultado<Product>>();
  const [relacionados, setRelacionados] = useState<Resultado<Product[]>>();
  const [avaliacoes, setAvaliacoes] = useState<Resultado<Resumo>>();
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

    avaliacoesProdutoApi.listar({ produtoId: id }, signal).then((items) => {
      if (signal.aborted) return;
      const total = items.length;
      const media = total ? items.reduce((soma, item) => soma + item.nota, 0) / total : 0;
      setAvaliacoes({ dados: { media, total } });
    }).catch(() => {
      if (!signal.aborted) setAvaliacoes({ erro: "Avaliações indisponíveis." });
    });

    return () => controller.abort();
  }, [id, tentativa]);

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
  const resumo = avaliacoes && "dados" in avaliacoes ? avaliacoes.dados : null;
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
              {resumo?.total ? (
                <span><span aria-hidden="true" className="text-amber-600">★ </span>{resumo.media.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} <span className="text-ink/70">| {resumo.total} {resumo.total === 1 ? "avaliação" : "avaliações"}</span></span>
              ) : (
                <span className="text-ink/70">{avaliacoes && "erro" in avaliacoes ? avaliacoes.erro : resumo ? "Sem avaliações" : "Carregando avaliações…"}</span>
              )}
              {produto.categoria?.slug && <Link className="text-brand hover:underline" href={`/categoria/${encodeURIComponent(produto.categoria.slug)}`}>{produto.categoria.nome}</Link>}
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
            {aviso && <p role="status" className="mt-4 text-green-800">{aviso}</p>}
          </div>
        </div>
      </div>

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
