"use client";

import { useState, type ReactNode } from "react";

export type ProductImage = { id?: number; urlImagem: string; ordem?: number };

type Props = {
  name: string;
  images?: ProductImage[] | null;
  className?: string;
  layout?: "catalog" | "detail";
  badge?: ReactNode;
};

/** Galeria reutilizável independente da API. Aceita imagens da entidade ImagemProduto. */
export default function ProductImageCard({ name, images, className = "", layout = "catalog", badge }: Props) {
  const ordered = [...(images ?? [])]
    .filter((image) => typeof image?.urlImagem === "string" && image.urlImagem.trim())
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const activeIndex = selectedIndex < ordered.length ? selectedIndex : 0;
  const activeUrl = ordered[activeIndex]?.urlImagem;
  const valid = activeUrl && !failedUrls.includes(activeUrl);
  const detail = layout === "detail";

  function markFailed(url: string) {
    setFailedUrls((urls) => urls.includes(url) ? urls : [...urls, url]);
  }

  return (
    <div className={`${detail ? "grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 min-[600px]:gap-5" : "overflow-hidden rounded-3xl border border-ink/10 bg-white"} ${detail && ordered.length > 1 ? "min-[600px]:grid-cols-[minmax(3.5rem,1fr)_minmax(0,4.2fr)]" : ""} ${className}`}>
      <div className={`relative flex aspect-square min-w-0 items-center justify-center ${detail ? "overflow-hidden rounded-[2rem] bg-white" : "bg-cream"} ${detail && ordered.length > 1 ? "min-[600px]:col-start-2 min-[600px]:row-start-1" : ""}`}>
        {badge && <div className="absolute top-3 right-3 z-10">{badge}</div>}
        {valid ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={activeUrl} alt={`Imagem ${activeIndex + 1} de ${name}`} className="h-full w-full object-contain" onError={() => markFailed(activeUrl)} />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center text-ink/60" role="img" aria-label={`Sem imagem disponível para ${name}`}>
            <span className="text-5xl" aria-hidden="true">▧</span>
            <span className="text-sm font-semibold">Imagem indisponível</span>
          </div>
        )}
      </div>
      {ordered.length > 1 && (
        <div data-thumbnails role="group" aria-label={`Imagens de ${name}`} className={detail
          ? "flex min-w-0 gap-2 overflow-x-auto p-0.5 min-[600px]:col-start-1 min-[600px]:row-start-1 min-[600px]:min-h-0 min-[600px]:flex-col min-[600px]:overflow-x-hidden min-[600px]:overflow-y-auto"
          : "flex gap-2 overflow-x-auto p-3"}>
          {ordered.map((image, index) => (
            <button
              key={`${image.id ?? image.urlImagem}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Ver imagem ${index + 1} de ${name}`}
              aria-pressed={activeIndex === index}
              className={`shrink-0 overflow-hidden border-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand ${detail ? "aspect-square w-16 rounded-[1.25rem] bg-white min-[600px]:w-full" : "h-14 w-14 rounded-xl bg-cream"} ${activeIndex === index ? "border-brand" : "border-transparent"}`}
            >
              {failedUrls.includes(image.urlImagem) ? <span aria-hidden="true">▧</span> : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image.urlImagem} alt="" className={`h-full w-full ${detail ? "object-contain" : "object-cover"}`} onError={() => markFailed(image.urlImagem)} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
