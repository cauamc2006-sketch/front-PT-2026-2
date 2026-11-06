"use client";

import { useState } from "react";

export type ProductImage = { id?: number; urlImagem: string; ordem?: number };

type Props = { name: string; images?: ProductImage[] | null; className?: string };

/** Galeria reutilizável independente da API. Aceita imagens da entidade ImagemProduto. */
export default function ProductImageCard({ name, images, className = "" }: Props) {
  const ordered = [...(images ?? [])]
    .filter((image) => typeof image?.urlImagem === "string" && image.urlImagem.trim())
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const selected = ordered.find((image) => image.urlImagem === selectedUrl) ?? ordered[0];
  const activeUrl = selected?.urlImagem;
  const valid = activeUrl && !failedUrls.includes(activeUrl);

  return (
    <div className={`overflow-hidden rounded-3xl border border-ink/10 bg-white ${className}`}>
      <div className="flex aspect-square items-center justify-center bg-cream">
        {valid ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={activeUrl} alt={`Imagem de ${name}`} className="h-full w-full object-contain" onError={() => setFailedUrls((urls) => urls.includes(activeUrl) ? urls : [...urls, activeUrl])} />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center text-ink/50" role="img" aria-label={`Sem imagem disponível para ${name}`}>
            <span className="text-5xl" aria-hidden="true">▧</span>
            <span className="text-sm font-semibold">Imagem indisponível</span>
          </div>
        )}
      </div>
      {ordered.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3" aria-label={`Imagens de ${name}`}>
          {ordered.map((image, index) => (
            <button key={`${image.id ?? image.urlImagem}-${index}`} type="button" onClick={() => setSelectedUrl(image.urlImagem)} aria-label={`Ver imagem ${index + 1} de ${name}`} aria-pressed={activeUrl === image.urlImagem} className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 bg-cream ${activeUrl === image.urlImagem ? "border-brand" : "border-transparent"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.urlImagem} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
