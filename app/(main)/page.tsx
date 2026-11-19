"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BarraPesquisa from "../components/BarraPesquisa";
import CardCategoria from "../components/CardCategoria";
import CardProduto from "../components/CardProduto";
import { getProducts, formatPrice, type Product } from "@/lib/products";
import { categoriasApi } from "@/lib/stockio-api";
import { CATEGORIAS, getCategoriaPorSlug } from "@/lib/constants";

export default function Feed() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [reload, setReload] = useState(0);
  const [categorias, setCategorias] = useState(CATEGORIAS);

  // Busca categorias dinâmicas da API (com fallback imediato para as categorias do Figma)
  useEffect(() => {
    let ativo = true;

    categoriasApi
      .listar(true)
      .then((res) => {
        if (ativo && res && res.length > 0) {
          const mapeadas = res.map((cat) => {
            const local = getCategoriaPorSlug(cat.slug) || getCategoriaPorSlug(cat.nome);
            return {
              nome: cat.nome,
              slug: local?.slug || cat.slug,
              imagem: local?.imagem || cat.imagemUrl || "/Feed/categoriaEletronicos.png",
              icone: local?.icone || "/lojas/mercado.svg",
              fraseBanner: local?.fraseBanner || "",
            };
          });
          const ordem = new Map(
            CATEGORIAS.map((categoria, index) => [categoria.slug, index])
          );

          mapeadas.sort(
            (a, b) =>
              (ordem.get(a.slug) ?? Number.MAX_SAFE_INTEGER) -
              (ordem.get(b.slug) ?? Number.MAX_SAFE_INTEGER)
          );

          const slugsExistentes = new Set(mapeadas.map((m) => m.slug.toLowerCase()));
          const complementares = CATEGORIAS.filter(
            (c) => !slugsExistentes.has(c.slug.toLowerCase())
          );

          setCategorias([...mapeadas, ...complementares]);
        }
      })
      .catch(() => {
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let ativo = true;

    getProducts(controller.signal)
      .then((items) => {
        if (ativo) {
          setProducts(items);
          setLoading(false);
        }
      })
      .catch((reason: unknown) => {
        if (ativo && !controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "Erro ao consultar produtos.");
          setLoading(false);
        }
      });

    return () => {
      ativo = false;
      controller.abort();
    };
  }, [reload]);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.ativo !== false &&
          (p.nome.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")) ||
            (p.descricao ?? "").toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")))
      ),
    [products, query]
  );

  return (
    <main className="min-h-screen bg-[#F6F3E4]">
      {/* Banner Principal com Ilustração */}
      <section className="bg-black text-white min-h-[200px] md:min-h-[250px] px-8 md:px-16 py-14 flex justify-between items-center relative overflow-hidden">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight relative z-10 max-w-xl">
          Do CAOS à organização,
          <br />
          em alguns cliques
        </h1>
        <div className="absolute right-0 bottom-0 w-[45%] md:w-[50%] h-[90%] md:h-full pointer-events-none">
          <Image
            src="/Feed/Entregadora.svg"
            alt="Mascote STOCK.IO"
            fill
            className="object-contain object-bottom"
            priority
          />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        {/* Barra de Pesquisa Reutilizável (Figma) */}
        <div className="flex justify-center -mt-16 md:-mt-18 mb-12 relative z-20 px-4">
          <BarraPesquisa
            value={query}
            onChange={setQuery}
            placeholder="Procurar por..."
            className="shadow-lg"
          />
        </div>

        {/* Seção Categorias com Navegação Dinâmica */}
        <section className="mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Categorias</h2>
          <div className="flex gap-6 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categorias.map((cat) => (
              <CardCategoria
                key={cat.nome}
                icone={cat.imagem}
                nome={cat.nome}
                slug={cat.slug}
              />
            ))}
          </div>
        </section>

        {/* Seção Produtos */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Produtos</h2>
            <Link
              href="/produtos"
              className="text-[#6A38F3] text-sm md:text-base font-semibold hover:underline"
            >
              Ver todos
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="w-10 h-10 border-4 border-[#6A38F3] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-medium text-base">Carregando produtos...</p>
            </div>
          ) : error ? (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center max-w-lg mx-auto">
              <p className="font-medium mb-3">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  setReload((v) => v + 1);
                }}
                className="px-5 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors text-sm cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm max-w-xl mx-auto my-8">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-500 text-sm mb-6">
                Não encontramos produtos correspondentes à sua pesquisa.
              </p>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="px-6 py-2.5 bg-[#6A38F3] text-white rounded-full text-sm font-semibold hover:bg-purple-700 transition-colors cursor-pointer"
                >
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 justify-items-center">
              {filtered.slice(0, 15).map((p) => {
                const firstImage = [...(p.imagens ?? [])].sort(
                  (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)
                )[0]?.urlImagem;

                return (
                  <CardProduto
                    key={p.id}
                    imagemUrl={firstImage}
                    nome={p.nome}
                    preco={formatPrice(p.preco)}
                    lojaLogo={p.loja?.logoUrl}
                    disponivel={p.ativo !== false && p.estoque > 0}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
