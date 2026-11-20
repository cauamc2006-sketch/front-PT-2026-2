"use client";

import { useState } from "react";
import Image from "next/image";
import { avaliacoesLojaApi, type AvaliacaoLoja } from "@/lib/stockio-api";

interface ModalAvaliarLojaProps {
  isOpen: boolean;
  onClose: () => void;
  lojaId: number;
  lojaNome: string;
  onAvaliacaoCriada?: (avaliacao: AvaliacaoLoja) => void;
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
        src={preenchida ? "/lojas/estrela-cheia.svg" : "/modais/estrela-borda.svg"}
        alt=""
        width={64}
        height={61}
        aria-hidden="true"
      />
    </button>
  );
}

export default function ModalAvaliarLoja({
  isOpen,
  onClose,
  lojaId,
  lojaNome,
  onAvaliacaoCriada,
}: ModalAvaliarLojaProps) {
  const [nota, setNota] = useState(0);
  const [notaHover, setNotaHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function limparFormulario() {
    setNota(0);
    setNotaHover(0);
    setComentario("");
    setErro(null);
  }

  function handleFechar() {
    limparFormulario();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (nota < 1 || nota > 5) {
      setErro("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    setEnviando(true);
    try {
      const novaAvaliacao = await avaliacoesLojaApi.criar({
        lojaId,
        nota,
        comentario: comentario.trim() || undefined,
      });

      onAvaliacaoCriada?.(novaAvaliacao);
      handleFechar();
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

  const notaExibida = notaHover || nota;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleFechar}
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
          className="absolute top-6 right-7 text-3xl font-light text-black hover:text-[#6A38F3] transition-colors cursor-pointer"
          aria-label="Fechar modal"
        >
          &times;
        </button>

        {/* Título */}
        <h2 className="text-3xl font-light text-black mb-8 mt-1 text-left">
          Você está avaliando <span className="font-semibold">{lojaNome}</span>
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

        {/* Campo de Comentário */}
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Avaliação da loja"
          className="w-full bg-white rounded-[24px] p-6 outline-none text-black h-64 resize-none placeholder:font-light placeholder:text-gray-400 shadow-sm focus:ring-1 focus:ring-[#6A38F3] mb-6"
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