"use client";

import { useState } from "react";
import { comentariosApi, type Comentario } from "@/lib/stockio-api";

interface ModalEditarComentarioProps {
  isOpen: boolean;
  onClose: () => void;
  comentario: Comentario;
  onComentarioAtualizado?: (comentarioAtualizado: Comentario) => void;
}

export default function ModalEditarComentario({
  isOpen,
  onClose,
  comentario,
  onComentarioAtualizado,
}: ModalEditarComentarioProps) {
  const [conteudo, setConteudo] = useState(comentario.conteudo);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function handleFechar() {
    if (enviando) return;
    setErro(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const conteudoLimpo = conteudo.trim();
    if (!conteudoLimpo) {
      setErro("Escreva um comentário antes de salvar.");
      return;
    }

    setEnviando(true);
    try {
      const comentarioAtualizado = await comentariosApi.atualizar(
        comentario.id,
        conteudoLimpo
      );

      onComentarioAtualizado?.(comentarioAtualizado);
      setErro(null);
      onClose();
    } catch (error: unknown) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o comentário.";
      setErro(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-editar-comentario"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[#EEEEEE] w-[720px] max-w-full rounded-[32px] px-12 pt-14 pb-10 relative flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="titulo-editar-comentario" className="sr-only">
          Editar comentário
        </h2>
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={handleFechar}
          disabled={enviando}
          className="absolute top-5 right-7 text-3xl font-light text-black hover:text-[#6A38F3] transition-colors cursor-pointer"
          aria-label="Fechar modal"
        >
          &times;
        </button>

        {/* Campo de Comentário */}
        <textarea
          id="editar-comentario"
          aria-label="Comentário"
          required
          maxLength={2000}
          disabled={enviando}
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          placeholder="Comentário"
          className="w-full bg-white rounded-[24px] p-6 outline-none text-black h-80 resize-none placeholder:font-light placeholder:text-gray-400 shadow-sm focus:ring-1 focus:ring-[#6A38F3] mb-7"
        />

        {/* Mensagem de Erro */}
        {erro && (
          <p
            role="alert"
            className="text-red-600 text-sm font-medium text-center mb-4"
          >
            {erro}
          </p>
        )}

        {/* Botão de Envio */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={enviando}
            className="w-[420px] max-w-full bg-[#6A38F3] text-white rounded-full py-3 text-lg font-medium shadow-md hover:bg-[#5a2ce0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {enviando ? "Salvando..." : "Salvar comentário"}
          </button>
        </div>
      </form>
    </div>
  );
}
