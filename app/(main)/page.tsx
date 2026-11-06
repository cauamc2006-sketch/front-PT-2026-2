"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CardCategoria from "../components/CardCategoria";
import { getProducts, formatPrice, type Product } from "@/lib/products";

const categories = [
  ["Mercado", "categoriaMercado.png"], ["Farmácia", "categoriaFarmacia.png"],
  ["Beleza", "categoriaBeleza.png"], ["Moda", "categoriaModa.png"],
  ["Eletrônicos", "categoriaEletronicos.png"], ["Jogos", "categoriaJogos.png"],
  ["Brinquedos", "categoriaBrinquedos.png"], ["Casa", "categoriaCasa.png"],
] as const;

export default function Feed() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [reload, setReload] = useState(0);
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
  const filtered = useMemo(() => products.filter((p) =>
    p.ativo !== false && p.nome.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))
  ), [products, query]);

  return (
    <main className="min-h-screen bg-[#F6F3E4]">
      <section className="bg-black text-white min-h-[200px] px-10 py-16 flex justify-between items-center relative overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight relative z-10">Do CAOS à organização,<br />em alguns cliques</h1>
        <div className="absolute right-0 bottom-0 w-[52%] h-full"><Image src="/Feed/Entregadora.svg" alt="Mascote" fill className="object-contain" priority /></div>
      </section>
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex justify-center -mt-16 mb-12 relative z-20">
          <label className="bg-white rounded-full flex items-center w-full max-w-3xl px-6 py-3 shadow-lg">
            <span className="sr-only">Buscar produtos</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder="Procurar por..." className="flex-grow outline-none text-gray-700 placeholder-purple-300" />
          </label>
        </div>
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Categorias</h2>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {categories.map(([nome, imagem]) => <CardCategoria key={nome} icone={`/Feed/${imagem}`} nome={nome} />)}
          </div>
        </section>
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Produtos</h2>
            <Link href="/produtos" className="text-purple-600 text-sm hover:underline">Ver todos</Link>
          </div>
          {loading ? <p role="status">Carregando produtos...</p> : error ? (
            <div role="alert" className="bg-white rounded-xl p-5">
              <p>{error}</p><button type="button" onClick={() => { setLoading(true); setError(null); setReload((v) => v + 1); }} className="mt-3 underline text-purple-600">Tentar novamente</button>
            </div>
          ) : filtered.length === 0 ? <p>Nenhum produto encontrado.</p> : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filtered.slice(0, 15).map((p) => (
                <article key={p.id} className="bg-white rounded-3xl p-4 shadow-sm">
                  <div className="h-36 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.imagens?.[0]?.urlImagem ? <img src={p.imagens[0].urlImagem} alt={p.nome} className="h-full w-full object-contain" /> : <span>Sem imagem</span>}
                  </div>
                  <h3 className="font-semibold text-gray-800 mt-3 truncate">{p.nome}</h3>
                  <p className="font-bold">{formatPrice(p.preco)}</p>
                  <p className="text-xs text-gray-500">{p.loja?.nome ?? "Loja não informada"}</p>
                  <p className="text-xs mt-1">{p.estoque > 0 ? "Disponível" : "Sem estoque"}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
