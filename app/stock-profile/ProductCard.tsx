"use client";

/* eslint-disable @next/next/no-img-element */
import { useId, useState } from "react";
import type { ImageRegion, Product } from "./types";
import styles from "./profile.module.css";

export function ProductImage({ src, alt, region }: { src?: string; alt: string; region?: ImageRegion }) {
  const [failedSource, setFailedSource] = useState<string>();
  const clipId = useId();
  return <div className={styles.productImage}>
    {src && src !== failedSource
      ? region
        ? <svg role="img" aria-label={alt} viewBox={`${region.x} ${region.y} ${region.width} ${region.height}`}>
          <defs><clipPath id={clipId}><rect x={region.x} y={region.y} width={region.width} height={region.height} /></clipPath></defs>
          <image href={src} width={region.sourceWidth} height={region.sourceHeight} clipPath={`url(#${clipId})`} onError={() => setFailedSource(src)} />
        </svg>
        : <img src={src} alt={alt} loading="lazy" onError={() => setFailedSource(src)} />
      : <span role="img" aria-label={alt} className={styles.placeholder}>Sem imagem</span>}
  </div>;
}

/** Card reutilizável: imagem, nome, preço e loja. */
export function ProductCard({ product }: { product: Product }) {
  const content = <>
    <ProductImage src={product.imageUrl} alt={product.imageAlt ?? product.name} region={product.imageRegion} />
    {product.storeLogoUrl && <div className={styles.storeLogo}>
      <ProductImage src={product.storeLogoUrl} alt={product.storeName ? `Logo de ${product.storeName}` : "Logo da loja"} />
    </div>}
    <div className={styles.productInfo}>
      <h3>{product.name}</h3>
      <p>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price)}</p>
      {product.available !== undefined && <span className={product.available ? styles.available : styles.unavailable}>{product.available ? "Disponível" : "Indisponível"}</span>}
      {product.storeName && !product.storeLogoUrl && <span className={styles.storeName}>{product.storeName}</span>}
    </div>
  </>;
  return <article className={styles.productCard}>{product.href ? <a href={product.href}>{content}</a> : content}</article>;
}

export function ProductGallery({ images, name }: { images: { src: string; alt?: string; region?: ImageRegion }[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const index = Math.min(selected, Math.max(0, images.length - 1));
  return <div className={styles.gallery}>
    <ProductImage key={images[index]?.src} src={images[index]?.src} alt={images[index]?.alt ?? name} region={images[index]?.region} />
    {images.length > 1 && <div className={styles.thumbnails} aria-label={`Imagens de ${name}`}>
      {images.map((image, i) => <button key={`${image.src}-${i}`} type="button" aria-label={`Ver imagem ${i + 1} de ${name}`} aria-pressed={i === index} onClick={() => setSelected(i)}>
        <ProductImage src={image.src} alt={image.alt ?? `${name}, imagem ${i + 1}`} region={image.region} />
      </button>)}
    </div>}
  </div>;
}
