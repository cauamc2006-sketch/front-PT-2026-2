"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CATEGORIAS } from "@/lib/constants";
import {
  categoriasApi,
  lojasApi,
  type Categoria,
  type Loja,
} from "@/lib/stockio-api";

interface ModalEditarLojaProps {
  isOpen: boolean;
  onClose: () => void;
  loja: Loja;
  onLojaAtualizada?: (lojaAtualizada: Loja) => void;
  onLojaExcluida?: () => void;
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

export default function ModalEditarLoja({
  isOpen,
  onClose,
  loja,
  onLojaAtualizada,
  onLojaExcluida,
}: ModalEditarLojaProps) {
  const [nome, setNome] = useState(loja.nome);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasAbertas, setCategoriasAbertas] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<Categoria | null>(null);

  // Arquivos e prévias das 3 imagens
  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
  const [previewFotoPerfil, setPreviewFotoPerfil] = useState<string | null>(
    null
  );

  const [logoSvg, setLogoSvg] = useState<File | null>(null);
  const [previewLogoSvg, setPreviewLogoSvg] = useState<string | null>(null);

  const [banner, setBanner] = useState<File | null>(null);
  const [previewBanner, setPreviewBanner] = useState<string | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const fotoPerfilRef = useRef<HTMLInputElement | null>(null);
  const logoSvgRef = useRef<HTMLInputElement | null>(null);
  const bannerRef = useRef<HTMLInputElement | null>(null);

  // Sincroniza nome, categorias e limpa erros ao abrir o modal
  useEffect(() => {
    if (!isOpen) return;
    let ativo = true;

    setNome(loja.nome);
    setErro(null);
    setCategoriasAbertas(false);

    categoriasApi
      .listar()
      .then((lista) => {
        if (!ativo) return;
        setCategorias(lista);

        // Tenta pré-selecionar a categoria atual da loja (por categoriaId ou nome)
        const lojaAny = loja as Loja & {
          categoriaId?: number;
          categoria?: string | { id: number; nome: string };
        };

        const encontrada = lista.find((cat) => {
          if (lojaAny.categoriaId && cat.id === lojaAny.categoriaId) return true;
          if (
            typeof lojaAny.categoria === "object" &&
            lojaAny.categoria?.id === cat.id
          )
            return true;
          if (
            typeof lojaAny.categoria === "string" &&
            normalizarTexto(cat.nome) === normalizarTexto(lojaAny.categoria)
          )
            return true;
          return false;
        });

        setCategoriaSelecionada(encontrada ?? null);
      })
      .catch(() => {
        if (ativo) setCategorias([]);
      });

    return () => {
      ativo = false;
    };
  }, [isOpen, loja]);

  function selecionarArquivo(
    file: File | null,
    setFile: (f: File | null) => void,
    previewAtual: string | null,
    setPreview: (url: string | null) => void
  ) {
    if (!file) return;
    if (previewAtual) URL.revokeObjectURL(previewAtual);
    setFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function removerArquivo(
    e: React.MouseEvent,
    setFile: (f: File | null) => void,
    previewAtual: string | null,
    setPreview: (url: string | null) => void,
    inputRef: React.RefObject<HTMLInputElement | null>
  ) {
    e.stopPropagation();
    if (previewAtual) URL.revokeObjectURL(previewAtual);
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFechar() {
    if (previewFotoPerfil) URL.revokeObjectURL(previewFotoPerfil);
    if (previewLogoSvg) URL.revokeObjectURL(previewLogoSvg);
    if (previewBanner) URL.revokeObjectURL(previewBanner);
    setFotoPerfil(null);
    setPreviewFotoPerfil(null);
    setLogoSvg(null);
    setPreviewLogoSvg(null);
    setBanner(null);
    setPreviewBanner(null);
    setErro(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      setErro("Informe o nome da loja.");
      return;
    }

    setEnviando(true);
    try {
      const arquivosParaEnviar: Array<{ campo: "logoUrl" | "stickerUrl" | "bannerUrl"; file: File }> = [];
      if (fotoPerfil) arquivosParaEnviar.push({ campo: "logoUrl", file: fotoPerfil });
      if (logoSvg) arquivosParaEnviar.push({ campo: "stickerUrl", file: logoSvg });
      if (banner) arquivosParaEnviar.push({ campo: "bannerUrl", file: banner });

      const urlsEnviadas =
        arquivosParaEnviar.length > 0
          ? await lojasApi.uploadImagens(arquivosParaEnviar.map((item) => item.file))
          : [];

      const imagensPayload: Partial<{ logoUrl: string; stickerUrl: string; bannerUrl: string }> = {};
      arquivosParaEnviar.forEach((item, index) => {
        if (urlsEnviadas[index]) {
          imagensPayload[item.campo] = urlsEnviadas[index];
        }
      });

      const lojaAtualizada = await lojasApi.atualizar(loja.id, {
        nome: nomeLimpo,
        ...imagensPayload,
      });

      onLojaAtualizada?.(lojaAtualizada);
      handleFechar();
    } catch (error: unknown) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar as alterações da loja.";
      setErro(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  async function handleDeletar() {
    const confirmou = window.confirm(
      `Tem certeza que deseja deletar a loja "${loja.nome}"? Essa ação não pode ser desfeita.`
    );
    if (!confirmou) return;

    setErro(null);
    setExcluindo(true);
    try {
      await lojasApi.excluir(loja.id);
      handleFechar();
      onLojaExcluida?.();
    } catch (error: unknown) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível deletar a loja.";
      setErro(mensagem);
    } finally {
      setExcluindo(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleFechar}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[#EEEEEE] w-[600px] max-w-full max-h-[92vh] overflow-y-auto rounded-[32px] p-8 relative flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={handleFechar}
          className="absolute top-6 right-6 text-3xl font-light text-black hover:text-[#6A38F3] transition-colors cursor-pointer"
          aria-label="Fechar modal"
        >
          &times;
        </button>

        {/* Título */}
        <h2 className="text-3xl font-medium text-center text-black mb-6 mt-1">
          Editar loja
        </h2>

        {/* Nome e Categoria */}
        <div className="flex flex-col gap-4 mb-6">
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da loja"
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
              <span>{categoriaSelecionada?.nome || "Categoria"}</span>
              <svg
                width="14"
                height="8"
                viewBox="0 0 14 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M1 1L7 7L13 1"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {categoriasAbertas && (
              <div className="absolute top-0 left-0 w-full bg-white rounded-[32px] p-6 shadow-xl z-50">
                <div
                  className="flex justify-between items-center mb-6 cursor-pointer text-[#6A38F3]"
                  onClick={() => setCategoriasAbertas(false)}
                >
                  <span className="text-2xl font-light">Categoria</span>
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
                        <label
                          key={cat.id}
                          className="flex items-center gap-6 cursor-pointer group"
                        >
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
                            <span className="text-[#6A38F3] font-light text-lg">
                              {cat.nome}
                            </span>
                            <div className="relative w-5 h-5 flex-shrink-0">
                              <Image
                                src={icone}
                                alt={`Ícone de ${cat.nome}`}
                                fill
                                className="object-contain"
                                unoptimized
                              />
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
        </div>

        {/* Áreas de Upload */}
        <div className="flex flex-col gap-4 mb-6">
          {/* 1. Foto de perfil */}
          <div className="relative w-full">
            <input
              ref={fotoPerfilRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                selecionarArquivo(
                  e.target.files?.[0] ?? null,
                  setFotoPerfil,
                  previewFotoPerfil,
                  setPreviewFotoPerfil
                )
              }
            />
            <button
              type="button"
              onClick={() => fotoPerfilRef.current?.click()}
              className="w-full cursor-pointer hover:opacity-85 transition-opacity rounded-2xl overflow-hidden block"
            >
              {previewFotoPerfil ? (
                <div className="relative w-full h-32 bg-white rounded-2xl overflow-hidden border-[1.5px] border-dashed border-[#6A38F3]">
                  <Image
                    src={previewFotoPerfil}
                    alt="Prévia da foto de perfil"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <Image
                  src="/modais/anexar-foto-loja.svg"
                  alt="Anexe a foto de perfil de sua loja"
                  width={828}
                  height={179}
                  className="w-full h-auto"
                />
              )}
            </button>
            {previewFotoPerfil && (
              <button
                type="button"
                onClick={(e) =>
                  removerArquivo(
                    e,
                    setFotoPerfil,
                    previewFotoPerfil,
                    setPreviewFotoPerfil,
                    fotoPerfilRef
                  )
                }
                aria-label="Remover foto de perfil"
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white text-sm flex items-center justify-center hover:bg-black cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>

          {/* 2. Logo em SVG */}
          <div className="relative w-full">
            <input
              ref={logoSvgRef}
              type="file"
              accept=".svg,image/svg+xml"
              className="hidden"
              onChange={(e) =>
                selecionarArquivo(
                  e.target.files?.[0] ?? null,
                  setLogoSvg,
                  previewLogoSvg,
                  setPreviewLogoSvg
                )
              }
            />
            <button
              type="button"
              onClick={() => logoSvgRef.current?.click()}
              className="w-full cursor-pointer hover:opacity-85 transition-opacity rounded-2xl overflow-hidden block"
            >
              {previewLogoSvg ? (
                <div className="relative w-full h-32 bg-white rounded-2xl overflow-hidden border-[1.5px] border-dashed border-[#6A38F3]">
                  <Image
                    src={previewLogoSvg}
                    alt="Prévia da logo em SVG"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <Image
                  src="/modais/anexar-logo-loja.svg"
                  alt="Anexe a logo em SVG de sua loja"
                  width={828}
                  height={179}
                  className="w-full h-auto"
                />
              )}
            </button>
            {previewLogoSvg && (
              <button
                type="button"
                onClick={(e) =>
                  removerArquivo(
                    e,
                    setLogoSvg,
                    previewLogoSvg,
                    setPreviewLogoSvg,
                    logoSvgRef
                  )
                }
                aria-label="Remover logo em SVG"
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white text-sm flex items-center justify-center hover:bg-black cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>

          {/* 3. Banner */}
          <div className="relative w-full">
            <input
              ref={bannerRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                selecionarArquivo(
                  e.target.files?.[0] ?? null,
                  setBanner,
                  previewBanner,
                  setPreviewBanner
                )
              }
            />
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              className="w-full cursor-pointer hover:opacity-85 transition-opacity rounded-2xl overflow-hidden block"
            >
              {previewBanner ? (
                <div className="relative w-full h-32 bg-white rounded-2xl overflow-hidden border-[1.5px] border-dashed border-[#6A38F3]">
                  <Image
                    src={previewBanner}
                    alt="Prévia do banner"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <Image
                  src="/modais/anexar-banner-loja.svg"
                  alt="Anexe o banner de sua loja"
                  width={828}
                  height={179}
                  className="w-full h-auto"
                />
              )}
            </button>
            {previewBanner && (
              <button
                type="button"
                onClick={(e) =>
                  removerArquivo(
                    e,
                    setBanner,
                    previewBanner,
                    setPreviewBanner,
                    bannerRef
                  )
                }
                aria-label="Remover banner"
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white text-sm flex items-center justify-center hover:bg-black cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <p
            role="alert"
            className="text-red-600 text-sm font-medium text-center mb-4"
          >
            {erro}
          </p>
        )}

        {/* Botão DELETAR */}
        <button
          type="button"
          onClick={handleDeletar}
          disabled={excluindo || enviando}
          className="w-full bg-[#FF0000] text-white rounded-full py-3 text-base font-medium shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mb-5"
        >
          {excluindo ? "DELETANDO..." : "DELETAR"}
        </button>

        {/* Botão Salvar */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={enviando || excluindo}
            className="w-[240px] max-w-full bg-[#6A38F3] text-white rounded-full py-2.5 text-lg font-medium shadow-md hover:bg-[#5a2ce0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {enviando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}