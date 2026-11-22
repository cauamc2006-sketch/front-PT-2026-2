"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ProductImageCard from "@/app/components/ProductImageCard";
import { formatPrice, getProducts, type Product } from "@/lib/products";

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setReload((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let ativo = true;

    getProducts(controller.signal)
      .then((items) => {
        if (ativo) {
          setProducts(items);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (ativo && !controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "Erro ao carregar produtos.");
        }
      })
      .finally(() => {
        if (ativo && !controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      ativo = false;
      controller.abort();
    };
  }, [reload]);

  return (
    <main className="min-h-screen bg-cream px-5 py-10 text-ink sm:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm font-bold uppercase tracking-widest text-brand">STOCK.IO</p><h1 className="text-4xl font-extrabold">Produtos</h1></div>
          <Link href="/" className="rounded-full border border-ink/20 px-5 py-3 font-semibold hover:bg-white">Voltar ao início</Link>
        </header>
        {loading ? <p role="status">Carregando produtos...</p> : error ? (
          <section role="alert" className="rounded-3xl bg-white p-6"><p>{error}</p><button type="button" onClick={() => { setLoading(true); retry(); }} className="mt-4 rounded-full bg-brand px-5 py-3 font-bold text-white">Tentar novamente</button></section>
        ) : products.length === 0 ? <p>Nenhum produto cadastrado.</p> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-3xl bg-white p-4 shadow-sm">
                <ProductImageCard name={product.nome} images={product.imagens} />
                <div className="pt-4"><h2 className="text-xl font-extrabold"><Link href={`/produtos/${product.id}`} className="hover:underline">{product.nome}</Link></h2><p className="mt-1 line-clamp-2 text-sm text-ink/70">{product.descricao || "Sem descrição"}</p><p className="mt-3 text-xl font-bold text-brand">{formatPrice(product.preco)}</p><p className="mt-1 text-sm">{product.estoque > 0 ? `${product.estoque} em estoque` : "Sem estoque"}</p></div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
