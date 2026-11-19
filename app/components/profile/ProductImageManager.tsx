"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { productImagesApi, uploadProductImages, type PersistedProductImage } from "@/lib/products";

export function ProductImageManager({ productId, initialImages }: { productId: number; initialImages: PersistedProductImage[] }) {
  const [images, setImages] = useState(() => [...initialImages].sort((a, b) => a.ordem - b.ordem));
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [replaceId, setReplaceId] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const previewRef = useRef<string[]>([]);
  useEffect(() => () => previewRef.current.forEach(URL.revokeObjectURL), []);

  function choose(selected: FileList | null, imageId?: number) {
    previewRef.current.forEach(URL.revokeObjectURL);
    const next = Array.from(selected ?? []);
    if (next.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setMessage("Use imagens JPG, PNG ou WebP de até 5 MB."); return;
    }
    if (!imageId && images.length + next.length > 4) { setMessage("Cada produto pode ter no máximo 4 imagens."); return; }
    const urls = next.map(URL.createObjectURL); previewRef.current = urls; setPreviews(urls); setFiles(next); setReplaceId(imageId); setMessage("");
  }

  async function save() {
    if (!files.length || busy) return;
    setBusy(true); setMessage("");
    try {
      const urls = await uploadProductImages(files);
      if (replaceId) {
        const updated = await productImagesApi.replace(productId, replaceId, urls[0]);
        setImages(current => current.map(image => image.id === replaceId ? updated : image));
      } else setImages(await productImagesApi.add(productId, urls));
      setFiles([]); setPreviews([]); setReplaceId(undefined); previewRef.current.forEach(URL.revokeObjectURL); previewRef.current = []; setMessage("Galeria atualizada.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível atualizar a galeria."); }
    finally { setBusy(false); }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction; if (target < 0 || target >= images.length || busy) return;
    const next = [...images]; [next[index], next[target]] = [next[target], next[index]]; setBusy(true);
    try { setImages(await productImagesApi.reorder(productId, next.map((image, position) => ({ id: image.id, ordem: position + 1 })))); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível reordenar."); }
    finally { setBusy(false); }
  }

  return <div className="mt-3 rounded-xl border border-gray-200 p-3 text-sm">
    <strong>Imagens do produto</strong>
    <div className="mt-2 flex flex-wrap gap-2">{images.map((image, index) => <div key={image.id} className="w-24">
      <Image src={image.urlImagem} alt={`Imagem ${index + 1}`} width={96} height={80} unoptimized className="h-20 w-24 rounded object-cover" />
      <div className="flex justify-center gap-1"><button disabled={busy || index === 0} onClick={() => void move(index, -1)} aria-label="Mover imagem para a esquerda">←</button><button disabled={busy || index === images.length - 1} onClick={() => void move(index, 1)} aria-label="Mover imagem para a direita">→</button></div>
      <label className="cursor-pointer text-[#6A38F3]">substituir<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => choose(event.target.files, image.id)} /></label>{" · "}<button className="text-red-600" disabled={busy} onClick={() => void productImagesApi.remove(productId, image.id).then(setImages).catch(error => setMessage(error.message))}>remover</button>
    </div>)}</div>
    {previews.length > 0 && <div className="mt-2 flex gap-2">{previews.map(url => <Image key={url} src={url} alt="Prévia selecionada" width={64} height={64} unoptimized className="h-16 w-16 rounded object-cover" />)}</div>}
    {!replaceId && images.length < 4 && <label className="mt-2 inline-block cursor-pointer rounded border px-3 py-1">Selecionar imagens<input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={event => choose(event.target.files)} /></label>}
    {files.length > 0 && <button className="ml-2 rounded bg-[#6A38F3] px-3 py-1 text-white" disabled={busy} onClick={() => void save()}>{busy ? "Salvando…" : replaceId ? "Substituir" : "Adicionar"}</button>}
    {message && <p role="status" className="mt-2">{message}</p>}
  </div>;
}
