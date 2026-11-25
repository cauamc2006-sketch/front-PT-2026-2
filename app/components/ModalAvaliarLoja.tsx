"use client";

import { avaliacoesLojaApi, type AvaliacaoLoja } from "@/lib/stockio-api";
import ModalCriarAvaliacao from "./ModalCriarAvaliacao";

interface ModalAvaliarLojaProps {
  isOpen: boolean;
  onClose: () => void;
  lojaId: number;
  lojaNome: string;
  onAvaliacaoCriada?: (avaliacao: AvaliacaoLoja) => void;
}

export default function ModalAvaliarLoja({
  isOpen,
  onClose,
  lojaId,
  lojaNome,
  onAvaliacaoCriada,
}: ModalAvaliarLojaProps) {
  return (
    <ModalCriarAvaliacao
      isOpen={isOpen}
      onClose={onClose}
      nome={lojaNome}
      rotuloComentario="Avaliação da loja"
      onSubmit={async (dados) => {
        const avaliacao = await avaliacoesLojaApi.criar({ lojaId, ...dados });
        onAvaliacaoCriada?.(avaliacao);
      }}
    />
  );
}
