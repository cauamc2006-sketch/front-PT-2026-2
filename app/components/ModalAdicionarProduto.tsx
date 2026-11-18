import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CATEGORIAS } from "@/lib/constants";
import { categoriasApi, produtosApi, type Categoria, type Product } from "@/lib/stockio-api";

interface ModalAdicionarProdutoProps {
  isOpen: boolean;
  onClose: () => void;
  lojaId: number;
  onProdutoCriado?: (produto: Product) => void;
}

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function iconeDaCategoria(nome: string): string {
  const alvo = normalizarTexto(nome);
  const encontrada = CATEGORIAS.find((c) => normalizarTexto(c.nome) === alvo);
  return encontrada?.icone ?? "/lojas/mercado.svg";
}

export default function ModalAdicionarProduto({
  isOpen,
  onClose,
  lojaId,
  onProdutoCriado,
}: ModalAdicionarProdutoProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [precoTexto, setPrecoTexto] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasAbertas, setCategoriasAbertas] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria | null>(null);
  const [arquivos, setArquivos] = useState<(File | null)[]>([null, null, null, null]);
  const [previews, setPreviews] = useState<(string | null)[]>([null, null, null, null]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  useEffect(() => {
    if (!isOpen) return;
    let ativo = true;

    categoriasApi
      .listar()
      .then((lista) => {
        if (ativo) setCategorias(lista);
      })
      .catch(() => {
        if (ativo) setCategorias([]);
      });

    return () => {
      ativo = false;
    };
  }, [isOpen]);

  function selecionarImagem(indice: number, file: File | null) {
    if (!file) return;
    setArquivos((prev) => {
      const next = [...prev];
      next[indice] = file;
      return next;
    });
    setPreviews((prev) => {
      const next = [...prev];
      if (next[indice]) URL.revokeObjectURL(next[indice]!);
      next[indice] = URL.createObjectURL(file);
      return next;
    });
  }

  function removerImagem(indice: number, e: React.MouseEvent) {
    e.stopPropagation();
    setArquivos((prev) => {
      const next = [...prev];
      next[indice] = null;
      return next;
    });
    setPreviews((prev) => {
      const next = [...prev];
      if (next[indice]) URL.revokeObjectURL(next[indice]!);
      next[indice] = null;
      return next;
    });
    const input = fileInputRefs.current[indice];
    if (input) input.value = "";
  }

  function limparFormulario() {
    previews.forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    setNome("");
    setDescricao("");
    setPrecoTexto("");
    setQuantidade(1);
    setCategoriaSelecionada(null);
    setCategoriasAbertas(false);
    setArquivos([null, null, null, null]);
    setPreviews([null, null, null, null]);
    setErro(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      setErro("Informe o nome do produto.");
      return;
    }

    if (!categoriaSelecionada) {
      setErro("Selecione uma categoria.");
      return;
    }

    const precoNumerico = Number(precoTexto.replace(/\s+/g, "").replace(",", "."));
    if (!precoTexto.trim() || !Number.isFinite(precoNumerico) || precoNumerico < 0) {
      setErro("Informe um preço válido (ex.: 29,90).");
      return;
    }

    setEnviando(true);
    try {
      const arquivosSelecionados = arquivos.filter((f): f is File => f !== null);
      const urlsImagens =
        arquivosSelecionados.length > 0
          ? await produtosApi.uploadImagens(arquivosSelecionados)
          : [];

      const novoProduto = await produtosApi.criar({
        lojaId,
        categoriaId: categoriaSelecionada.id,
        nome: nomeLimpo,
        descricao: descricao.trim() || undefined,
        preco: Number(precoNumerico.toFixed(2)),
        estoque: quantidade,
        ativo: true,
        imagens: urlsImagens.length > 0 ? urlsImagens : undefined,
      });

      onProdutoCriado?.(novoProduto);
      limparFormulario();
      onClose();
    } catch (error: unknown) {
      const mensagem =
        error instanceof Error ? error.message : "Não foi possível adicionar o produto.";
      setErro(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[#EEEEEE] w-[600px] max-h-[92vh] overflow-y-auto rounded-[32px] p-8 relative flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-3xl font-light text-black hover:text-[#6A38F3] transition-colors cursor-pointer"
          aria-label="Fechar modal"
        >
          &times;
        </button>

        <h2 className="text-3xl font-medium text-center text-black mb-8 mt-2">
          Adicionar Produto
        </h2>

        {/* Área de Upload de Imagens */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Caixa Principal (índice 0) */}
          <div className="relative w-full">
            <input
              ref={(el) => {
                fileInputRefs.current[0] = el;
              }}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => selecionarImagem(0, e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRefs.current[0]?.click()}
              className="w-full cursor-pointer hover:opacity-85 transition-opacity rounded-2xl overflow-hidden relative block"
            >
              {previews[0] ? (
                <div className="relative w-full h-36 bg-white rounded-2xl overflow-hidden border-[1.5px] border-dashed border-[#6A38F3]">
                  <Image src={previews[0]} alt="Prévia principal" fill className="object-contain" unoptimized />
                </div>
              ) : (
                <Image
                  src="/modais/anexar_grande.svg"
                  alt="Anexe as fotos do seu produto"
                  width={828}
                  height={179}
                  className="w-full h-auto"
                />
              )}
            </button>
            {previews[0] && (
              <button
                type="button"
                onClick={(e) => removerImagem(0, e)}
                aria-label="Remover imagem principal"
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white text-sm flex items-center justify-center hover:bg-black cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>

          {/* 3 Caixas Secundárias */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((indice) => (
              <div key={indice} className="relative w-full">
                <input
                  ref={(el) => {
                    fileInputRefs.current[indice] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => selecionarImagem(indice, e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[indice]?.click()}
                  className="w-full cursor-pointer hover:opacity-85 transition-opacity rounded-2xl overflow-hidden block"
                >
                  {previews[indice] ? (
                    <div className="relative w-full h-28 bg-white rounded-2xl overflow-hidden border-[1.5px] border-dashed border-[#6A38F3]">
                      <Image
                        src={previews[indice]!}
                        alt={`Prévia secundária ${indice}`}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <Image
                      src="/modais/anexar_pequeno.svg"
                      alt={`Anexar foto secundária ${indice}`}
                      width={230}
                      height={151}
                      className="w-full h-auto"
                    />
                  )}
                </button>
                {previews[indice] && (
                  <button
                    type="button"
                    onClick={(e) => removerImagem(indice, e)}
                    aria-label={`Remover imagem secundária ${indice}`}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-black cursor-pointer"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-4 mb-6">
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do produto"
            className="w-full bg-white rounded-full px-6 py-3 outline-none text-black placeholder:font-light shadow-sm focus:ring-1 focus:ring-[#6A38F3]"
          />

          <div className="relative w-full">
            <button
              type="button"
              onClick={() => setCategoriasAbertas(true)}
              className={`w-full flex justify-between items-center bg-white rounded-full px-6 py-3 outline-none font-light shadow-sm cursor-pointer ${
                categoriaSelecionada ? "text-black" : "text-gray-500"
              }`}
            >
              <span>{categoriaSelecionada?.nome || "Subcategoria"}</span>
              <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {categoriasAbertas && (
              <div className="absolute top-0 left-0 w-full bg-white rounded-[32px] p-6 shadow-xl z-50">
                <div
                  className="flex justify-between items-center mb-6 cursor-pointer text-[#6A38F3]"
                  onClick={() => setCategoriasAbertas(false)}
                >
                  <span className="text-2xl font-light">Subcategoria</span>
                  <span className="text-xl">^</span>
                </div>

                {categorias.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Nenhuma categoria cadastrada no banco.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4 max-h-64 overflow-y-auto">
                    {categorias.map((cat) => {
                      const selecionada = categoriaSelecionada?.id === cat.id;
                      const icone = cat.imagemUrl || iconeDaCategoria(cat.nome);
                      return (
                        <label key={cat.id} className="flex items-center gap-6 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selecionada}
                            onChange={() => {
                              setCategoriaSelecionada(selecionada ? null : cat);
                              setCategoriasAbertas(false);
                            }}
                            className="appearance-none w-6 h-6 border-[1.5px] border-[#6A38F3] rounded-[8px] checked:bg-[#6A38F3] cursor-pointer transition-colors flex-shrink-0"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-[#6A38F3] font-light text-lg">{cat.nome}</span>
                            <div className="relative w-5 h-5 flex-shrink-0">
                              <Image src={icone} alt={`Ícone de ${cat.nome}`} fill className="object-contain" unoptimized />
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição do produto"
            className="w-full bg-white rounded-[24px] px-6 py-4 outline-none text-black h-32 resize-none placeholder:font-light shadow-sm focus:ring-1 focus:ring-[#6A38F3]"
          ></textarea>

          <input
            type="text"
            inputMode="decimal"
            value={precoTexto}
            onChange={(e) => setPrecoTexto(e.target.value)}
            placeholder="Preço do produto (ex.: 29,90)"
            className="w-full bg-white rounded-full px-6 py-3 outline-none text-black placeholder:font-light shadow-sm focus:ring-1 focus:ring-[#6A38F3]"
          />
        </div>

        {/* Seletor de Quantidade */}
        <div className="flex justify-center items-center gap-8 mb-6">
          <button
            type="button"
            onClick={() => setQuantidade(Math.max(0, quantidade - 1))}
            className="w-12 h-12 rounded-full border-[1.5px] border-[#6A38F3] flex items-center justify-center text-[#6A38F3] text-4xl font-light hover:bg-[#6A38F3] hover:text-white transition-colors cursor-pointer"
          >
            -
          </button>
          <span className="text-5xl text-[#6A38F3] font-medium w-16 text-center">
            {quantidade}
          </span>
          <button
            type="button"
            onClick={() => setQuantidade(quantidade + 1)}
            className="w-12 h-12 rounded-full border-[1.5px] border-[#6A38F3] flex items-center justify-center text-[#6A38F3] text-4xl font-light hover:bg-[#6A38F3] hover:text-white transition-colors cursor-pointer"
          >
            +
          </button>
        </div>

        {erro && (
          <p role="alert" className="text-red-600 text-sm font-medium text-center mb-4">
            {erro}
          </p>
        )}

        {/* Botão Adicionar */}
        <div className="flex justify-center mb-2">
          <button
            type="submit"
            disabled={enviando}
            className="bg-[#6A38F3] text-white rounded-full px-20 py-3 text-lg font-medium shadow-md hover:bg-[#5a2ce0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {enviando ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </form>
    </div>
  );
}
