"use client";

import { useId, useState } from "react";
import Image from "next/image";

interface ModalCriarAvaliacaoProps {
  isOpen: boolean;
  onClose: () => void;
  nome: string;
  rotuloComentario: string;
  onSubmit: (dados: { nota: number; comentario?: string }) => Promise<void>;
}

function EstrelaAvaliacao({
  preenchida,
  selecionada,
  disabled,
  onClick,
  onMouseEnter,
  onMouseLeave,
  indice,
}: {
  preenchida: boolean;
  selecionada: boolean;
  disabled: boolean;
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
      disabled={disabled}
      aria-pressed={selecionada}
      aria-label={`Dar nota ${indice} de 5`}
      className="cursor-pointer transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-brand"
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

export default function ModalCriarAvaliacao({
  isOpen,
  onClose,
  nome,
  rotuloComentario,
  onSubmit,
}: ModalCriarAvaliacaoProps) {
  const tituloId = useId();
  const [nota, setNota] = useState<number | null>(null);
  const [notaHover, setNotaHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function limparFormulario() {
    setNota(null);
    setNotaHover(0);
    setComentario("");
    setErro(null);
  }

  function handleFechar() {
    if (enviando) return;
    limparFormulario();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setErro(null);

    if (nota === null) {
      setErro("Selecione uma nota de 0 a 5 estrelas.");
      return;
    }

    setEnviando(true);
    try {
      await onSubmit({
        nota,
        comentario: comentario.trim() || undefined,
      });

      limparFormulario();
      onClose();
    } catch (error: unknown) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível enviar sua avaliação.";
      setErro(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  if (!isOpen) return null;

  const notaExibida = notaHover || (nota ?? 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby={tituloId}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[#EEEEEE] w-[720px] max-w-full rounded-[32px] max-h-[90dvh] overflow-y-auto px-6 py-10 sm:px-12 relative flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={handleFechar}
          disabled={enviando}
          className="absolute top-6 right-7 text-3xl font-light text-black hover:text-[#6A38F3] transition-colors cursor-pointer"
          aria-label="Fechar modal"
        >
          &times;
        </button>

        {/* Título */}
        <h2 id={tituloId} className="pr-8 text-3xl font-light text-black mb-8 mt-1 text-left">
          Você está avaliando <span className="font-semibold">{nome}</span>
        </h2>

        {/* Seletor de 5 Estrelas */}
        <div
          className="flex items-center justify-center gap-2 mb-5 sm:gap-4"
          onMouseLeave={() => setNotaHover(0)}
        >
          {[1, 2, 3, 4, 5].map((estrela) => (
            <EstrelaAvaliacao
              key={estrela}
              indice={estrela}
              preenchida={estrela <= notaExibida}
              selecionada={nota === estrela}
              disabled={enviando}
              onClick={() => setNota(estrela)}
              onMouseEnter={() => setNotaHover(estrela)}
              onMouseLeave={() => setNotaHover(0)}
            />
          ))}
        </div>

        <button type="button" disabled={enviando} onClick={() => setNota(0)} aria-pressed={nota === 0} className="mx-auto mb-5 block rounded-full px-4 py-1 text-sm text-[#5A3CF0] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#5A3CF0]">Avaliar com 0 estrelas</button>

        {/* Campo de Comentário */}
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          aria-label={rotuloComentario}
          placeholder={rotuloComentario}
          disabled={enviando}
          className="w-full bg-white rounded-[24px] p-6 outline-none text-black h-32 resize-none sm:h-64 placeholder:font-light placeholder:text-gray-400 shadow-sm focus:ring-1 focus:ring-[#6A38F3] mb-6"
        />

        {/* Mensagem de Erro */}
        {erro && (
          <p role="alert" className="text-red-600 text-sm font-medium text-center mb-4">
            {erro}
          </p>
        )}

        {/* Botão Avaliar */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={enviando}
            className="w-[420px] max-w-full bg-[#6A38F3] text-white rounded-full py-3 text-lg font-medium shadow-md hover:bg-[#5a2ce0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {enviando ? "Avaliando..." : "Avaliar"}
          </button>
        </div>
      </form>
    </div>
  );
}
