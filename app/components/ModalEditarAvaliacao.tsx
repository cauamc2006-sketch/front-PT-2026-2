"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  avaliacoesLojaApi,
  avaliacoesProdutoApi,
  type AvaliacaoLoja,
  type AvaliacaoProduto,
} from "@/lib/stockio-api";

type AvaliacaoEditavel = AvaliacaoLoja | AvaliacaoProduto;

interface ModalEditarAvaliacaoProps {
  isOpen: boolean;
  onClose: () => void;
  tipo?: "loja" | "produto";
  avaliacao: AvaliacaoEditavel | null;
  alvoNome?: string;
  lojaNome?: string;
  onAvaliacaoAtualizada?: (avaliacaoAtualizada: AvaliacaoEditavel) => void;
  onAvaliacaoExcluida?: (avaliacaoId: number) => void;
}

function EstrelaAvaliacao({
  preenchida,
  onClick,
  onMouseEnter,
  onMouseLeave,
  indice,
}: {
  preenchida: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  indice: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={`Dar nota ${indice} de 5`}
      className="cursor-pointer transition-transform hover:scale-110 focus:outline-none"
    >
      <Image
        src={preenchida ? "/lojas/estrela-cheia.svg" : "/Modais/estrela-borda.svg"}
        alt=""
        width={64}
        height={61}
        aria-hidden="true"
      />
    </button>
  );
}

export default function ModalEditarAvaliacao({
  isOpen,
  onClose,
  tipo = "loja",
  avaliacao,
  alvoNome,
  lojaNome,
  onAvaliacaoAtualizada,
  onAvaliacaoExcluida,
}: ModalEditarAvaliacaoProps) {
  const [nota, setNota] = useState(0);
  const [notaHover, setNotaHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const nomeExibido = alvoNome ?? lojaNome ?? "";
  const api = tipo === "produto" ? avaliacoesProdutoApi : avaliacoesLojaApi;

  useEffect(() => {
    if (!isOpen || !avaliacao) return;
    setNota(avaliacao.nota);
    setNotaHover(0);
    setComentario(avaliacao.comentario ?? "");
    setErro(null);
  }, [isOpen, avaliacao]);

  function handleFechar() {
    if (enviando || excluindo) return;
    setNotaHover(0);
    setErro(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!avaliacao) return;
    setErro(null);

    if (!Number.isInteger(nota) || nota < 0 || nota > 5) {
      setErro("Selecione uma nota de 0 a 5 estrelas.");
      return;
    }

    setEnviando(true);
    try {
      const atualizada = await api.atualizar(avaliacao.id, {
        nota,
        comentario: comentario.trim(),
      });

      onAvaliacaoAtualizada?.(atualizada);
      handleFechar();
    } catch (error: unknown) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar sua avaliação.";
      setErro(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  async function handleDeletar() {
    if (!avaliacao) return;
    const confirmou = window.confirm(
      "Tem certeza que deseja deletar sua avaliação?"
    );
    if (!confirmou) return;

    setErro(null);
    setExcluindo(true);
    try {
      await api.excluir(avaliacao.id);
      onAvaliacaoExcluida?.(avaliacao.id);
      handleFechar();
    } catch (error: unknown) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível deletar sua avaliação.";
      setErro(mensagem);
    } finally {
      setExcluindo(false);
    }
  }

  if (!isOpen || !avaliacao) return null;

  const notaExibida = notaHover || nota;
  const ocupado = enviando || excluindo;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-editar-avaliacao"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[#EEEEEE] w-[720px] max-w-full rounded-[32px] px-12 py-10 relative flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={handleFechar}
          disabled={ocupado}
          className="absolute top-6 right-7 text-3xl font-light text-black hover:text-[#6A38F3] transition-colors cursor-pointer"
          aria-label="Fechar modal"
        >
          &times;
        </button>

        {/* Título */}
        <h2 id="titulo-editar-avaliacao" className="text-3xl font-light text-black mb-8 mt-1 text-left">
          Você está avaliando <span className="font-semibold">{nomeExibido}</span>
        </h2>

        {/* Seletor de 5 Estrelas */}
        <div
          className="flex items-center justify-center gap-4 mb-8"
          onMouseLeave={() => setNotaHover(0)}
        >
          {[1, 2, 3, 4, 5].map((estrela) => (
            <EstrelaAvaliacao
              key={estrela}
              indice={estrela}
              preenchida={estrela <= notaExibida}
              onClick={() => setNota(estrela)}
              onMouseEnter={() => setNotaHover(estrela)}
              onMouseLeave={() => setNotaHover(0)}
            />
          ))}
        </div>

        <button type="button" disabled={ocupado} onClick={() => setNota(0)} aria-pressed={nota === 0} className="mx-auto mb-5 block rounded-full px-4 py-1 text-sm text-[#5A3CF0] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#5A3CF0] disabled:opacity-50">Alterar para 0 estrelas</button>

        {/* Campo de Comentário */}
        <textarea
          id="editar-avaliacao"
          aria-label="Texto da avaliação"
          maxLength={2000}
          disabled={ocupado}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder={
            tipo === "produto" ? "Avaliação do produto" : "Avaliação da loja"
          }
          className="w-full bg-white rounded-[24px] p-6 outline-none text-black h-64 resize-none placeholder:font-light placeholder:text-gray-400 shadow-sm focus:ring-1 focus:ring-[#6A38F3] mb-6"
        />

        {/* Mensagem de Erro */}
        {erro && (
          <p role="alert" className="text-red-600 text-sm font-medium text-center mb-4">
            {erro}
          </p>
        )}

        {/* Botões Deletar e Salvar */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleDeletar}
            disabled={ocupado}
            className="w-[420px] max-w-full bg-red-600 text-white rounded-full py-3 text-lg font-medium shadow-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {excluindo ? "Deletando..." : "Deletar"}
          </button>

          <button
            type="submit"
            disabled={ocupado}
            className="w-[420px] max-w-full bg-[#6A38F3] text-white rounded-full py-3 text-lg font-medium shadow-md hover:bg-[#5a2ce0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {enviando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
