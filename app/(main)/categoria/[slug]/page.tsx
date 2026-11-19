"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
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

export interface SubcategoriaItem {
  id?: number;
  nome: string;
  slug?: string;
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
  const rawParam =
    typeof params?.slug === "string"
      ? params.slug
      : Array.isArray(params?.slug)
      ? params.slug[0]
      : "";
  const slug = decodeURIComponent(rawParam).toLowerCase().trim();

  // Informações estáticas/visuais de fallback (ícone, banner temático, subcategorias padrão)
  const categoriaLocal = useMemo(() => getCategoriaPorSlug(slug), [slug]);

  const [categoriaBackend, setCategoriaBackend] = useState<CategoriaBackend | null>(null);
  const [subcategorias, setSubcategorias] = useState<SubcategoriaItem[]>([]);
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [reload, setReload] = useState(0);

  const [ordenacao, setOrdenacao] = useState<OpcaoOrdenacao>("padrao");
  const [menuOrdenacaoAberto, setMenuOrdenacaoAberto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora ou apertar Escape (Acessibilidade)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOrdenacaoAberto(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOrdenacaoAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Busca dados da categoria e subcategorias no backend
  useEffect(() => {
    let ativo = true;

    async function carregarCategoria() {
      try {
        const todas = await categoriasApi.listar();
        if (!ativo) return;

        const encontrada = todas.find(
          (c) =>
            c.slug.toLowerCase() === slug ||
            c.nome.toLowerCase() === slug ||
            c.nome.toLowerCase() === categoriaLocal?.nome.toLowerCase()
        );

        if (encontrada) {
          setCategoriaBackend(encontrada);

          // Popula subcategorias da API (aninhadas ou com categoriaPaiId)
          let subList: SubcategoriaItem[] = [];
          if (encontrada.subcategorias && encontrada.subcategorias.length > 0) {
            subList = encontrada.subcategorias.map((s) => ({
              id: s.id,
              nome: s.nome,
              slug: s.slug,
            }));
          } else {
            const filhas = todas.filter((c) => c.categoriaPaiId === encontrada.id);
            if (filhas.length > 0) {
              subList = filhas.map((s) => ({
                id: s.id,
                nome: s.nome,
                slug: s.slug,
              }));
            }
          }

          // Se a API ainda não possui subcategorias cadastradas, usa o padrão do Figma
          if (subList.length === 0 && categoriaLocal?.subcategoriasPadrao) {
            subList = categoriaLocal.subcategoriasPadrao.map((nome) => ({ nome }));
          }

          setSubcategorias(subList);
        } else {
          // Fallback se não encontrada no banco
          if (categoriaLocal?.subcategoriasPadrao) {
            setSubcategorias(categoriaLocal.subcategoriasPadrao.map((nome) => ({ nome })));
          }
        }
      } catch {
        if (ativo && categoriaLocal?.subcategoriasPadrao) {
          setSubcategorias(categoriaLocal.subcategoriasPadrao.map((nome) => ({ nome })));
        }
      }
    }

    void carregarCategoria();

    return () => {
      ativo = false;
    };
  }, [slug, categoriaLocal]);

  // Busca produtos reais do backend
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

  // Filtra e ordena produtos de forma combinada e determinística
  const produtosFiltrados = useMemo(() => {
    const nomeCategoria = (categoriaBackend?.nome ?? categoriaLocal?.nome ?? slug).toLowerCase();
    const catId = categoriaBackend?.id;
    const subIds = new Set(
      subcategorias.map((s) => s.id).filter((id): id is number => id !== undefined)
    );

    // 1. Filtro da Categoria Principal
    let lista = products.filter((p) => {
      if (p.categoria) {
        const prodCatSlug = p.categoria.slug.toLowerCase();
        const prodCatNome = p.categoria.nome.toLowerCase();
        if (prodCatSlug === slug || prodCatNome === nomeCategoria) return true;
        if (catId !== undefined && (p.categoriaId === catId || p.categoria.categoriaPaiId === catId)) {
          return true;
        }
        if (p.categoriaId && subIds.has(p.categoriaId)) {
          return true;
        }
      }

      if (catId !== undefined && p.categoriaId === catId) {
        return true;
      }
      if (p.categoriaId && subIds.has(p.categoriaId)) {
        return true;
      }

      // Fallback permissivo apenas para produtos antigos/mock sem categoria atribuída
      return !p.categoriaId && !p.categoria;
    });

    // 2. Filtro de Subcategoria Selecionada
    if (subcategoriaSelecionada) {
      const subItem = subcategorias.find((s) => s.nome === subcategoriaSelecionada);
      const subTermo = subcategoriaSelecionada.toLowerCase();

      lista = lista.filter((p) => {
        if (subItem?.id && p.categoriaId === subItem.id) {
          return true;
        }
        const pCatNome = (p.categoria?.nome ?? "").toLowerCase();
        const pCatSlug = (p.categoria?.slug ?? "").toLowerCase();
        if (pCatNome === subTermo || (subItem?.slug && pCatSlug === subItem.slug.toLowerCase())) {
          return true;
        }
        const nomeProd = p.nome.toLowerCase();
        const descProd = (p.descricao ?? "").toLowerCase();
        return nomeProd.includes(subTermo) || descProd.includes(subTermo);
      });
    }

    // 3. Filtro de Busca Textual (Barra de Pesquisa)
    if (busca.trim()) {
      const termo = busca.toLowerCase().trim();
      lista = lista.filter(
        (p) =>
          p.nome.toLowerCase().includes(termo) ||
          (p.descricao ?? "").toLowerCase().includes(termo)
      );
    }

    // 4. Ordenação
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
  }, [
    products,
    slug,
    categoriaLocal,
    categoriaBackend,
    subcategorias,
    subcategoriaSelecionada,
    busca,
    ordenacao,
  ]);

  const limparFiltros = useCallback(() => {
    setBusca("");
    setSubcategoriaSelecionada(null);
  }, []);

  const nomeExibicao = categoriaBackend?.nome ?? categoriaLocal?.nome ?? rawParam;
  const fraseBanner = categoriaLocal?.fraseBanner ?? `O universo de ${nomeExibicao}\nem um só lugar`;
  const linhasFrase = fraseBanner.split("\n");

  // Ilustração temática da categoria (Figma: categoriaEletronicos.png, etc.)
  const bannerImagem =
    categoriaBackend?.imagemUrl ||
    categoriaLocal?.imagem ||
    "/Feed/categoriaEletronicos.png";

  return (
    <main className="min-h-screen bg-[#F6F3E4]">
      {/* Banner Superior Preto com Ilustração Temática da Categoria (Figma) */}
      <section className="bg-black text-white min-h-[220px] md:min-h-[270px] px-8 md:px-16 py-12 flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs md:text-sm text-gray-300 hover:text-white mb-3 transition-colors group"
          >
            <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
            <span>Voltar para o Feed</span>
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

        {/* Ilustração Temática da Categoria (Figma: ilustrações em 3D da categoria) */}
        <div className="absolute right-4 md:right-16 bottom-0 w-[180px] sm:w-[240px] md:w-[320px] h-[85%] md:h-[95%] pointer-events-none flex items-end justify-end">
          <div className="relative w-full h-full">
            <Image
              src={bannerImagem}
              alt={`Ilustração temática da categoria ${nomeExibicao}`}
              fill
              className="object-contain object-bottom drop-shadow-2xl"
              priority
              unoptimized={bannerImagem.startsWith("http")}
            />
          </div>
        </div>
      </section>

      {/* Barra de Pesquisa Reutilizável com Busca Contextual (Figma) */}
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          {/* Pílulas de Subcategorias (Chips com scroll suave em mobile) */}
          <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => setSubcategoriaSelecionada(null)}
              className={`flex-shrink-0 rounded-full px-5 py-2 text-sm md:text-base font-semibold transition-all shadow-sm cursor-pointer ${
                subcategoriaSelecionada === null
                  ? "bg-[#6A38F3] text-white shadow-purple-200"
                  : "bg-white text-[#6A38F3] hover:bg-purple-50"
              }`}
            >
              Todos
            </button>

            {subcategorias.map((sub) => {
              const ativo = subcategoriaSelecionada === sub.nome;
              return (
                <button
                  key={sub.nome}
                  type="button"
                  onClick={() => setSubcategoriaSelecionada(ativo ? null : sub.nome)}
                  className={`flex-shrink-0 rounded-full px-5 py-2 text-sm md:text-base font-semibold transition-all shadow-sm cursor-pointer ${
                    ativo
                      ? "bg-[#6A38F3] text-white shadow-purple-200"
                      : "bg-white text-[#6A38F3] hover:bg-purple-50"
                  }`}
                >
                  {sub.nome}
                </button>
              );
            })}
          </div>

          {/* Seletor "ordenar por" (Figma) */}
          <div className="relative self-end sm:self-auto flex-shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setMenuOrdenacaoAberto((prev) => !prev)}
              aria-expanded={menuOrdenacaoAberto}
              aria-haspopup="listbox"
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
                aria-hidden="true"
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
              <div
                role="listbox"
                className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-30 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 px-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    ordenar
                  </span>
                  <button
                    type="button"
                    onClick={() => setMenuOrdenacaoAberto(false)}
                    aria-label="Fechar menu de ordenação"
                    className="p-1 hover:opacity-75 transition-opacity"
                  >
                    <svg
                      width="12"
                      height="8"
                      viewBox="0 0 14 9"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="rotate-180"
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
                </div>

                <div className="space-y-1">
                  {OPCOES_ORDENACAO.map((opcao) => {
                    const ativa = ordenacao === opcao.id;
                    return (
                      <button
                        key={opcao.id}
                        type="button"
                        role="option"
                        aria-selected={ativa}
                        onClick={() => {
                          setOrdenacao(opcao.id);
                          setMenuOrdenacaoAberto(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
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

        {/* Grid de Produtos (5 colunas responsivo) */}
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
              className="px-5 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors text-sm cursor-pointer"
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
                onClick={limparFiltros}
                className="px-6 py-2.5 bg-[#6A38F3] text-white rounded-full text-sm font-semibold hover:bg-purple-700 transition-colors cursor-pointer"
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
