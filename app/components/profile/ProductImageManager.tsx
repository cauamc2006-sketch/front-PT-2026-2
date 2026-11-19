"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { productImagesApi, uploadProductImages, type PersistedProductImage } from "@/lib/products";
import styles from "./profile.module.css";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ProductImageManager({ productId, initialImages }: { productId: number; initialImages: PersistedProductImage[] }) {
  const [images, setImages] = useState(() => [...initialImages].sort((a, b) => a.ordem - b.ordem));
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [replaceId, setReplaceId] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const previewRef = useRef<string[]>([]);

  useEffect(() => () => previewRef.current.forEach(URL.revokeObjectURL), []);

  function resetSelection() {
    previewRef.current.forEach(URL.revokeObjectURL);
    previewRef.current = [];
    setPreviews([]);
    setFiles([]);
    setReplaceId(undefined);
  }

  function choose(selected: FileList | null, imageId?: number) {
    resetSelection();
    const next = Array.from(selected ?? []);
    if (!next.length) return;
    if (next.some(file => !ACCEPTED_TYPES.includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setMessage("Use imagens JPG, PNG ou WebP de até 5 MB.");
      return;
    }
    if (!imageId && images.length + next.length > 4) {
      setMessage("Cada produto pode ter no máximo 4 imagens.");
      return;
    }
    const urls = next.map(URL.createObjectURL);
    previewRef.current = urls;
    setPreviews(urls);
    setFiles(next);
    setReplaceId(imageId);
    setMessage("");
  }

  async function save() {
    if (!files.length || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const urls = await uploadProductImages(files);
      if (replaceId) {
        const updated = await productImagesApi.replace(productId, replaceId, urls[0]);
        setImages(current => current.map(image => image.id === replaceId ? updated : image));
      } else {
        setImages(await productImagesApi.add(productId, urls));
      }
      resetSelection();
      setMessage("Galeria atualizada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar a galeria.");
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length || busy) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setBusy(true);
    try {
      setImages(await productImagesApi.reorder(productId, next.map((image, position) => ({ id: image.id, ordem: position + 1 }))));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível reordenar.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(imageId: number) {
    if (busy || !window.confirm("Remover esta imagem do produto?")) return;
    setBusy(true);
    setMessage("");
    try {
      setImages(await productImagesApi.remove(productId, imageId));
      setMessage("Imagem removida.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível remover a imagem.");
    } finally {
      setBusy(false);
    }
  }

  const slots = Array.from({ length: 4 }, (_, index) => images[index]);

  return <section className={styles.imageManager} aria-labelledby={`product-images-${productId}`}>
    <div className={styles.imageManagerHeading}>
      <div><h3 id={`product-images-${productId}`}>Imagens do produto</h3><p>Até quatro imagens. A primeira será a capa.</p></div>
      <span>{images.length}/4</span>
    </div>
    <div className={styles.imageSlots}>
      {slots.map((image, index) => <div key={image?.id ?? `empty-${index}`} className={index === 0 ? styles.mainImageSlot : styles.imageSlot}>
        {image ? <>
          <Image src={image.urlImagem} alt={index === 0 ? "Imagem principal do produto" : `Imagem ${index + 1} do produto`} fill sizes={index === 0 ? "280px" : "100px"} unoptimized className={styles.managedImage} />
          <div className={styles.imageControls}>
            <button type="button" disabled={busy || index === 0} onClick={() => void move(index, -1)} aria-label="Mover imagem para a esquerda">←</button>
            <button type="button" disabled={busy || index === images.length - 1} onClick={() => void move(index, 1)} aria-label="Mover imagem para a direita">→</button>
            <label aria-label="Substituir imagem">↻<input className={styles.srOnly} type="file" accept="image/jpeg,image/png,image/webp" onChange={event => choose(event.target.files, image.id)} /></label>
            <button type="button" disabled={busy} onClick={() => void remove(image.id)} aria-label="Remover imagem">×</button>
          </div>
        </> : <label className={styles.emptyImageSlot}>
          <span aria-hidden="true">＋</span><small>{index === 0 ? "Adicionar capa" : "Adicionar foto"}</small>
          <input className={styles.srOnly} type="file" accept="image/jpeg,image/png,image/webp" multiple={index === 0} onChange={event => choose(event.target.files)} />
        </label>}
      </div>)}
    </div>
    {previews.length > 0 && <div className={styles.pendingImages}>
      <div>{previews.map((url, index) => <Image key={url} src={url} alt={`Prévia ${index + 1}`} width={64} height={64} unoptimized />)}</div>
      <button type="button" className={styles.primary} disabled={busy} onClick={() => void save()}>{busy ? "Salvando…" : replaceId ? "Substituir imagem" : "Adicionar imagens"}</button>
    </div>}
    {message && <p role="status" className={styles.imageMessage}>{message}</p>}
  </section>;
}
