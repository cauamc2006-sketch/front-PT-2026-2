import type { ProductImage } from "@/components/ProductImageCard";

export type Product = {
  id: number;
  nome: string;
  descricao?: string | null;
  preco: string | number;
  estoque: number;
  ativo?: boolean;
  imagens?: ProductImage[];
  loja?: { nome?: string; logoUrl?: string } | null;
};

/** Formato já usado pelo ProductCard da branch feat/perfil. */
export type ProfileCardProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  imageAlt?: string;
  href?: string;
  storeLogoUrl?: string;
  storeName?: string;
  available?: boolean;
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/+$/, "");

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseImages(value: unknown): ProductImage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const url = entry.urlImagem;
    if (typeof url !== "string" || !url.trim()) return [];
    return [{
      urlImagem: url,
      ...(typeof entry.id === "number" ? { id: entry.id } : {}),
      ...(typeof entry.ordem === "number" ? { ordem: entry.ordem } : {}),
    }];
  });
}

/** Valida a resposta antes de renderizar: a branch do CRUD ainda retorna strings de exemplo. */
export function parseProducts(payload: unknown): Product[] {
  if (!Array.isArray(payload)) {
    throw new Error("A API de produtos ainda não devolve uma lista. O CRUD precisa ser concluído no backend.");
  }
  return payload.map((entry, index) => {
    if (!isRecord(entry) || typeof entry.id !== "number" || typeof entry.nome !== "string" ||
      !(typeof entry.preco === "number" || typeof entry.preco === "string") ||
      !Number.isFinite(Number(entry.preco)) || typeof entry.estoque !== "number") {
      throw new Error(`Produto ${index + 1} com formato inválido na resposta da API.`);
    }
    const loja = isRecord(entry.loja) ? entry.loja : null;
    return {
      id: entry.id,
      nome: entry.nome,
      descricao: typeof entry.descricao === "string" ? entry.descricao : null,
      preco: entry.preco,
      estoque: entry.estoque,
      ativo: typeof entry.ativo === "boolean" ? entry.ativo : true,
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

/** Adaptador para aproveitar o card existente na branch feat/perfil, sem duplicar seu código. */
export function toProfileCardProduct(product: Product): ProfileCardProduct {
  const firstImage = [...(product.imagens ?? [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))[0];
  return {
    id: String(product.id),
    name: product.nome,
    price: Number(product.preco),
    imageUrl: firstImage?.urlImagem,
    imageAlt: `Imagem de ${product.nome}`,
    href: `/produtos/${product.id}`,
    storeName: product.loja?.nome,
    storeLogoUrl: product.loja?.logoUrl,
    available: product.ativo !== false && product.estoque > 0,
  };
}

export function formatPrice(value: Product["preco"]): string {
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(number)
    : "Preço indisponível";
}
