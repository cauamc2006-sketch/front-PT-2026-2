"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";
import BarraPesquisa from "@/app/components/BarraPesquisa";
import CardProduto from "@/app/components/CardProduto";
import { getProducts, formatPrice, type Product } from "@/lib/products";
import { categoriasApi, type CategoriaBackend } from "@/lib/stockio-api";
import { getCategoriaPorSlug } from "@/lib/constants";

type OpcaoOrdenacao =
  | "padrao"
  | "menor-preco"
  | "maior-preco"
  | "a-z"
  | "disponiveis";

interface OpcaoConfig {
  id: OpcaoOrdenacao;
  label: string;
}

const OPCOES_ORDENACAO: OpcaoConfig[] = [
  { id: "padrao", label: "Padrão" },
  { id: "menor-preco", label: "Menor preço" },
  { id: "maior-preco", label: "Maior preço" },
  { id: "a-z", label: "A–Z" },
  { id: "disponiveis", label: "Disponíveis primeiro" },
];

export default function TelaCategoria() {
  const params = useParams();
  const slugParam = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";
  const slug = slugParam.toLowerCase().trim();

  const categoriaLocal = useMemo(() => getCategoriaPorSlug(slug), [slug]);

  const [categoriaBackend, setCategoriaBackend] = useState<CategoriaBackend | null>(null);
  const [subcategorias, setSubcategorias] = useState<string[]>([]);
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [reload, setReload] = useState(0);

  const [ordenacao, setOrdenacao] = useState<OpcaoOrdenacao>("padrao");
  const [menuOrdenacaoAberto, setMenuOrdenacaoAberto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOrdenacaoAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Busca dados da categoria e subcategorias no backend
  useEffect(() => {
    let ativo = true;

    async function carregarCategoria() {
      try {
        const todas = await categoriasApi.listar();
        if (!ativo) return;

        const encontrada = todas.find(
          (c) => c.slug.toLowerCase() === slug || c.nome.toLowerCase() === slug
        );

        if (encontrada) {
          setCategoriaBackend(encontrada);
          if (encontrada.subcategorias && encontrada.subcategorias.length > 0) {
            setSubcategorias(encontrada.subcategorias.map((s) => s.nome));
          } else {
            setSubcategorias(categoriaLocal?.subcategoriasPadrao ?? []);
          }
        } else {
          setSubcategorias(categoriaLocal?.subcategoriasPadrao ?? []);
        }
      } catch {
        if (ativo) {
          setSubcategorias(categoriaLocal?.subcategoriasPadrao ?? []);
        }
      }
    }

    void carregarCategoria();

    return () => {
      ativo = false;
    };
  }, [slug, categoriaLocal]);

  // Busca produtos do backend
  useEffect(() => {
    const controller = new AbortController();
    let ativo = true;

    getProducts(controller.signal)
      .then((items) => {
        if (ativo) {
          setProducts(items);
          setCarregando(false);
        }
      })
      .catch((reason: unknown) => {
        if (ativo && !controller.signal.aborted) {
          setErro(reason instanceof Error ? reason.message : "Erro ao consultar produtos.");
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
      controller.abort();
    };
  }, [reload]);

  // Filtra e ordena produtos
  const produtosFiltrados = useMemo(() => {
    const nomeCategoria = categoriaLocal?.nome.toLowerCase() ?? slug;
    const catId = categoriaBackend?.id;

    let lista = products.filter((p) => {
      // Filtra por categoria
      const pertenceCategoria =
        p.categoria?.slug.toLowerCase() === slug ||
        p.categoria?.nome.toLowerCase() === nomeCategoria ||
        (catId !== undefined && p.categoriaId === catId) ||
        (catId !== undefined && p.categoria?.categoriaPaiId === catId);

      // Se a categoria ainda não tiver produtos cadastrados diretamente no backend com essa categoriaId,
      // não filtra totalmente se o banco tiver apenas produtos sem categoria associada (fallback para visualização)
      return pertenceCategoria || (!p.categoriaId && !p.categoria);
    });

    // Filtra por subcategoria selecionada
    if (subcategoriaSelecionada) {
      const sub = subcategoriaSelecionada.toLowerCase();
      lista = lista.filter((p) => {
        const nomeProd = p.nome.toLowerCase();
        const descProd = (p.descricao ?? "").toLowerCase();
        const catNome = (p.categoria?.nome ?? "").toLowerCase();
        return nomeProd.includes(sub) || descProd.includes(sub) || catNome === sub;
      });
    }

    // Filtra por texto na Barra de Pesquisa
    if (busca.trim()) {
      const termo = busca.toLowerCase().trim();
      lista = lista.filter(
        (p) =>
          p.nome.toLowerCase().includes(termo) ||
          (p.descricao ?? "").toLowerCase().includes(termo)
      );
    }

    // Ordenação
    const resultado = [...lista];
    switch (ordenacao) {
      case "menor-preco":
        resultado.sort((a, b) => Number(a.preco) - Number(b.preco));
        break;
      case "maior-preco":
        resultado.sort((a, b) => Number(b.preco) - Number(a.preco));
        break;
      case "a-z":
        resultado.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        break;
      case "disponiveis":
        resultado.sort((a, b) => {
          const aDisp = a.ativo !== false && a.estoque > 0 ? 1 : 0;
          const bDisp = b.ativo !== false && b.estoque > 0 ? 1 : 0;
          return bDisp - aDisp;
        });
        break;
      default:
        break;
    }

    return resultado;
  }, [products, slug, categoriaLocal, categoriaBackend, subcategoriaSelecionada, busca, ordenacao]);

  const nomeExibicao = categoriaBackend?.nome ?? categoriaLocal?.nome ?? slugParam;
  const fraseBanner = categoriaLocal?.fraseBanner ?? `O universo de ${nomeExibicao}\nem um só lugar`;
  const linhasFrase = fraseBanner.split("\n");

  return (
    <main className="min-h-screen bg-[#F6F3E4]">
      {/* Banner Superior Preto com Ilustração do Mascote */}
      <section className="bg-black text-white min-h-[220px] md:min-h-[260px] px-8 md:px-16 py-12 flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs md:text-sm text-gray-400 hover:text-white mb-3 transition-colors"
          >
            ← Voltar para o Feed
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
            {linhasFrase[0]}
            {linhasFrase[1] && (
              <>
                <br />
                {linhasFrase[1]}
              </>
            )}
          </h1>
        </div>

        {/* Ilustração do Mascote (Figma) */}
        <div className="absolute right-4 md:right-16 bottom-0 w-[220px] md:w-[320px] h-[95%] pointer-events-none">
          <Image
            src="/boneco-cadastro.svg"
            alt="Mascote STOCK.IO"
            fill
            className="object-contain object-bottom"
            priority
          />
        </div>
      </section>

      {/* Barra de Pesquisa Reutilizável (Figma) */}
      <div className="flex justify-center -mt-6 md:-mt-7 mb-8 relative z-20 px-4">
        <BarraPesquisa
          value={busca}
          onChange={setBusca}
          placeholder="Procurar por..."
          className="shadow-lg"
        />
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 pb-16">
        {/* Linha de Subcategorias e Seletor "ordenar por" */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Pílulas de Subcategorias */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => setSubcategoriaSelecionada(null)}
              className={`rounded-full px-5 py-2 text-sm md:text-base font-semibold transition-all shadow-sm ${
                subcategoriaSelecionada === null
                  ? "bg-[#6A38F3] text-white shadow-purple-200"
                  : "bg-white text-[#6A38F3] hover:bg-purple-50"
              }`}
            >
              Todos
            </button>

            {subcategorias.map((sub) => {
              const ativo = subcategoriaSelecionada === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubcategoriaSelecionada(ativo ? null : sub)}
                  className={`rounded-full px-5 py-2 text-sm md:text-base font-semibold transition-all shadow-sm ${
                    ativo
                      ? "bg-[#6A38F3] text-white shadow-purple-200"
                      : "bg-white text-[#6A38F3] hover:bg-purple-50"
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>

          {/* Seletor "ordenar por" (Figma) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setMenuOrdenacaoAberto((prev) => !prev)}
              aria-expanded={menuOrdenacaoAberto}
              className="bg-white text-[#6A38F3] rounded-full px-6 py-2.5 text-sm md:text-base font-semibold flex items-center gap-2 shadow-sm border border-transparent hover:border-purple-200 transition-all cursor-pointer"
            >
              <span>ordenar por</span>
              <svg
                width="14"
                height="9"
                viewBox="0 0 14 9"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-transform duration-200 ${
                  menuOrdenacaoAberto ? "rotate-180" : ""
                }`}
              >
                <path
                  d="M1 1.5L7 7.5L13 1.5"
                  stroke="#6A38F3"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Menu Dropdown Expandido (Figma) */}
            {menuOrdenacaoAberto && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 px-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    ordenar
                  </span>
                  <svg
                    width="12"
                    height="8"
                    viewBox="0 0 14 9"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="rotate-180 cursor-pointer"
                    onClick={() => setMenuOrdenacaoAberto(false)}
                  >
                    <path
                      d="M1 1.5L7 7.5L13 1.5"
                      stroke="#6A38F3"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="space-y-1">
                  {OPCOES_ORDENACAO.map((opcao) => {
                    const ativa = ordenacao === opcao.id;
                    return (
                      <button
                        key={opcao.id}
                        type="button"
                        onClick={() => {
                          setOrdenacao(opcao.id);
                          setMenuOrdenacaoAberto(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${
                          ativa
                            ? "bg-purple-50 text-[#6A38F3]"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                            ativa ? "border-[#6A38F3]" : "border-gray-300"
                          }`}
                        >
                          {ativa && (
                            <span className="w-2 h-2 rounded-full bg-[#6A38F3]" />
                          )}
                        </span>
                        <span>{opcao.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grid de Produtos (5 colunas no Desktop) */}
        {carregando ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <div className="w-10 h-10 border-4 border-[#6A38F3] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-medium text-base">Carregando produtos de {nomeExibicao}...</p>
          </div>
        ) : erro ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center max-w-lg mx-auto">
            <p className="font-medium mb-3">{erro}</p>
            <button
              type="button"
              onClick={() => {
                setCarregando(true);
                setErro(null);
                setReload((v) => v + 1);
              }}
              className="px-5 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors text-sm"
            >
              Tentar novamente
            </button>
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm max-w-xl mx-auto my-8">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Não encontramos produtos para os filtros ou busca selecionada nesta categoria.
            </p>
            {(busca || subcategoriaSelecionada) && (
              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setSubcategoriaSelecionada(null);
                }}
                className="px-6 py-2.5 bg-[#6A38F3] text-white rounded-full text-sm font-semibold hover:bg-purple-700 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 justify-items-center">
            {produtosFiltrados.map((p) => {
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
      </div>
    </main>
  );
}
