import type { ProductImage } from "@/app/components/ProductImageCard";
import { API_URL } from "./config";
import { readSession } from "./session";

export type Product = {
  id: number;
  nome: string;
  descricao?: string | null;
  preco: string | number;
  estoque: number;
  ativo?: boolean;
  categoriaId?: number;
  categoria?: {
    id: number;
    nome: string;
    slug: string;
    categoriaPaiId?: number | null;
  } | null;
  imagens?: ProductImage[];
  loja?: { nome?: string; logoUrl?: string } | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseImages(value: unknown): ProductImage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const rawUrl = typeof entry.urlImagem === "string" ? entry.urlImagem : typeof entry.url === "string" ? entry.url : "";
    const url = rawUrl.trim();
    if (!url) return [];
    return [{
      urlImagem: url,
      ...(typeof entry.id === "number" ? { id: entry.id } : {}),
      ...(typeof entry.ordem === "number" ? { ordem: entry.ordem } : {}),
    }];
  });
}

/** Valida e normaliza a resposta da API GET /produto. */
export function parseProducts(payload: unknown): Product[] {
  if (!Array.isArray(payload)) {
    throw new Error("A API de produtos não retornou uma lista válida.");
  }
  return payload.map((entry, index) => {
    if (!isRecord(entry) || typeof entry.id !== "number" || typeof entry.nome !== "string" ||
      !(typeof entry.preco === "number" || typeof entry.preco === "string") ||
      !Number.isFinite(Number(entry.preco)) || typeof entry.estoque !== "number") {
      throw new Error(`Produto ${index + 1} com formato inválido na resposta da API.`);
    }
    const loja = isRecord(entry.loja) ? entry.loja : null;
    const categoria = isRecord(entry.categoria) ? entry.categoria : null;
    return {
      id: entry.id,
      nome: entry.nome,
      descricao: typeof entry.descricao === "string" ? entry.descricao : null,
      preco: entry.preco,
      estoque: entry.estoque,
      ativo: typeof entry.ativo === "boolean" ? entry.ativo : true,
      categoriaId: typeof entry.categoriaId === "number" ? entry.categoriaId : undefined,
      categoria: categoria ? {
        id: typeof categoria.id === "number" ? categoria.id : 0,
        nome: typeof categoria.nome === "string" ? categoria.nome : "",
        slug: typeof categoria.slug === "string" ? categoria.slug : "",
        categoriaPaiId: typeof categoria.categoriaPaiId === "number" ? categoria.categoriaPaiId : null,
      } : null,
      imagens: parseImages(entry.imagens),
      loja: loja ? {
        nome: typeof loja.nome === "string" ? loja.nome : undefined,
        logoUrl: typeof loja.logoUrl === "string" ? loja.logoUrl : undefined,
      } : null,
    };
  });
}

export async function getProducts(signal?: AbortSignal): Promise<Product[]> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  let response: Response;
  try {
    response = await fetch(`${API_URL}/produto`, {
      signal,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("Não foi possível conectar ao backend. Confira se a API está ligada na porta 3001.");
  }
  if (!response.ok) throw new Error(`Não foi possível carregar os produtos (HTTP ${response.status}).`);
  let data: unknown;
  try { data = await response.json(); }
  catch { throw new Error("O backend não retornou um JSON válido."); }
  return parseProducts(data);
}

export function formatPrice(value: Product["preco"]): string {
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(number)
    : "Preço indisponível";
}

export type PersistedProductImage = { id: number; produtoId?: number; urlImagem: string; ordem: number };

async function productImageRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = readSession();
  if (!session) throw new Error("Entre novamente para gerenciar imagens.");
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: { Authorization: `Bearer ${session.token}`, ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...init.headers },
  });
  if (!response.ok) {
    let message = response.status === 401 ? "Sua sessão expirou. Entre novamente." : response.status === 403 ? "Você não tem permissão para alterar este produto." : `Não foi possível gerenciar as imagens (HTTP ${response.status}).`;
    try { const body = await response.json() as { message?: string | string[] }; if (body.message) message = Array.isArray(body.message) ? body.message.join(" ") : body.message; } catch { /* resposta sem JSON */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function uploadProductImages(files: File[]): Promise<string[]> {
  if (!files.length || files.length > 4) throw new Error("Selecione de 1 a 4 imagens.");
  const form = new FormData();
  files.forEach(file => form.append("files", file));
  const result = await productImageRequest<{ urls: string[] }>("/produto/upload", { method: "POST", body: form });
  return result.urls;
}

export const productImagesApi = {
  add: (productId: number, urls: string[]) => productImageRequest<PersistedProductImage[]>(`/produto/${productId}/imagens`, { method: "POST", body: JSON.stringify({ urls }) }),
  replace: (productId: number, imageId: number, urlImagem: string) => productImageRequest<PersistedProductImage>(`/produto/${productId}/imagens/${imageId}`, { method: "PATCH", body: JSON.stringify({ urlImagem }) }),
  remove: (productId: number, imageId: number) => productImageRequest<PersistedProductImage[]>(`/produto/${productId}/imagens/${imageId}`, { method: "DELETE" }),
  reorder: (productId: number, imagens: Array<{ id: number; ordem: number }>) => productImageRequest<PersistedProductImage[]>(`/produto/${productId}/imagens/reordenar`, { method: "PATCH", body: JSON.stringify({ imagens }) }),
};
