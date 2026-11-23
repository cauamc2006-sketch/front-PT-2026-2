import { API_URL } from "./config";
import { readSession } from "./session";

export type Loja = {
  id: number;
  nome: string;
  descricao?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  stickerUrl?: string | null;
  usuarioId: number;
  usuario?: { id: number; nome?: string | null; username?: string | null; fotoPerfilUrl?: string | null } | null;
};

export type Comentario = {
  id: number;
  conteudo: string;
  usuarioId: number;
  avaliacaoLojaId?: number | null;
  avaliacaoProdutoId?: number | null;
  criadoEm?: string;
  usuario?: { id: number; nome: string; username: string; fotoPerfilUrl?: string | null };
};

export type AvaliacaoLoja = {
  id: number;
  usuarioId: number;
  lojaId: number;
  nota: number;
  comentario?: string | null;
  criadoEm?: string;
  usuario?: { id: number; nome?: string | null; username?: string | null; fotoPerfilUrl?: string | null } | null;
};

export type AvaliacaoProduto = {
  id: number;
  usuarioId: number;
  produtoId: number;
  nota: number;
  comentario?: string | null;
  criadoEm?: string;
  usuario?: { id: number; nome?: string | null; username?: string | null; fotoPerfilUrl?: string | null } | null;
};

export type CategoriaBackend = {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  imagemUrl?: string | null;
  categoriaPaiId?: number | null;
  subcategorias?: CategoriaBackend[];
};

export type Categoria = CategoriaBackend;

export class StockioApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "StockioApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}, authenticated = false): Promise<T> {
  const session = readSession();
  const token = session?.token ?? (typeof window !== "undefined" ? window.localStorage.getItem("token") : null);
  if (authenticated && !token) throw new StockioApiError("Faça login para continuar.", 401);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token && authenticated ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new StockioApiError("Não foi possível conectar ao backend.", 0);
  }
  if (!response.ok) {
    let apiMessage = "";
    try {
      const body = (await response.json()) as { message?: unknown };
      if (typeof body?.message === "string") {
        apiMessage = body.message;
      } else if (Array.isArray(body?.message)) {
        apiMessage = body.message.filter((m): m is string => typeof m === "string").join(" ");
      }
    } catch {
      apiMessage = "";
    }

    const message =
      apiMessage ||
      (response.status === 401
        ? "Sessão inválida ou expirada."
        : response.status === 403
          ? "Você não tem permissão para esta operação."
          : response.status === 404
            ? "Registro não encontrado."
            : `Erro HTTP ${response.status}.`);
    throw new StockioApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const json = (value: unknown) => JSON.stringify(value);

async function uploadFiles(path: string, files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  const session = readSession();
  const token = session?.token ?? (typeof window !== "undefined" ? window.localStorage.getItem("token") : null);
  if (!token) throw new StockioApiError("Faça login para continuar.", 401);

  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch {
    throw new StockioApiError("Não foi possível conectar ao backend.", 0);
  }

  if (!response.ok) {
    throw new StockioApiError(`Erro ao enviar imagens (HTTP ${response.status}).`, response.status);
  }

  const data = (await response.json()) as { urls?: string[] };
  return Array.isArray(data.urls) ? data.urls : [];
}

export const lojasApi = {
  listar: () => request<Loja[]>("/loja"),
  buscar: (id: number) => request<Loja>(`/loja/${id}`),
  criar: (data: { nome: string; descricao?: string; logoUrl?: string }) =>
    request<Loja>("/loja", { method: "POST", body: json(data) }, true),
  atualizar: (
    id: number,
    data: Partial<{ nome: string; descricao: string; logoUrl: string; bannerUrl: string; stickerUrl: string }>,
  ) => request<Loja>(`/loja/${id}`, { method: "PATCH", body: json(data) }, true),
  excluir: (id: number) => request<Loja>(`/loja/${id}`, { method: "DELETE" }, true),
  uploadImagens: (files: File[]) => uploadFiles("/loja/upload", files),
};

export const categoriasApi = {
  listar: (raiz?: boolean) => request<CategoriaBackend[]>(`/categorias${raiz ? "?raiz=true" : ""}`),
  buscar: (id: number) => request<CategoriaBackend>(`/categorias/${id}`),
  buscarSubcategorias: (categoriaPaiId: number) =>
    request<CategoriaBackend[]>(`/categorias?categoriaPaiId=${categoriaPaiId}`),
};

export const comentariosApi = {
  listar: (filtro?: { avaliacaoLojaId?: number; avaliacaoProdutoId?: number }) => {
    const params = new URLSearchParams();
    if (filtro?.avaliacaoLojaId) params.set("avaliacaoLojaId", String(filtro.avaliacaoLojaId));
    if (filtro?.avaliacaoProdutoId) params.set("avaliacaoProdutoId", String(filtro.avaliacaoProdutoId));
    return request<Comentario[]>(`/comentarios${params.size ? `?${params}` : ""}`);
  },
  buscar: (id: number) => request<Comentario>(`/comentarios/${id}`),
  criar: (data: { conteudo: string; avaliacaoLojaId?: number; avaliacaoProdutoId?: number }) =>
    request<Comentario>("/comentarios", { method: "POST", body: json(data) }, true),
  atualizar: (id: number, conteudo: string) =>
    request<Comentario>(`/comentarios/${id}`, { method: "PATCH", body: json({ conteudo }) }, true),
  excluir: (id: number) => request<Comentario>(`/comentarios/${id}`, { method: "DELETE" }, true),
};

import { getProducts, parseProducts, formatPrice, type Product } from "./products";
export { getProducts, parseProducts, formatPrice, type Product };

export const avaliacoesLojaApi = {
  listar: (filtro?: { lojaId?: number; usuarioId?: number }) => {
    const params = new URLSearchParams();
    if (filtro?.lojaId) params.set("lojaId", String(filtro.lojaId));
    if (filtro?.usuarioId) params.set("usuarioId", String(filtro.usuarioId));
    return request<AvaliacaoLoja[]>(`/avaliacao-loja${params.size ? `?${params}` : ""}`);
  },
  buscar: (id: number) => request<AvaliacaoLoja>(`/avaliacao-loja/${id}`),
  criar: (data: { lojaId: number; nota: number; comentario?: string }) =>
    request<AvaliacaoLoja>("/avaliacao-loja", { method: "POST", body: json(data) }, true),
  atualizar: (id: number, data: { nota?: number; comentario?: string }) =>
    request<AvaliacaoLoja>(`/avaliacao-loja/${id}`, { method: "PATCH", body: json(data) }, true),
  excluir: (id: number) =>
    request<AvaliacaoLoja>(`/avaliacao-loja/${id}`, { method: "DELETE" }, true),
};

export const avaliacoesProdutoApi = {
  listar: (filtro?: { produtoId?: number; usuarioId?: number }, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (filtro?.produtoId) params.set("produtoId", String(filtro.produtoId));
    if (filtro?.usuarioId) params.set("usuarioId", String(filtro.usuarioId));
    return request<AvaliacaoProduto[]>(`/avaliacao-produto${params.size ? `?${params}` : ""}`, { signal });
  },
  buscar: (id: number) => request<AvaliacaoProduto>(`/avaliacao-produto/${id}`),
  criar: (data: { produtoId: number; nota: number; comentario?: string }) =>
    request<AvaliacaoProduto>("/avaliacao-produto", { method: "POST", body: json(data) }, true),
  atualizar: (id: number, data: { nota?: number; comentario?: string }) =>
    request<AvaliacaoProduto>(`/avaliacao-produto/${id}`, { method: "PATCH", body: json(data) }, true),
  excluir: (id: number) =>
    request<AvaliacaoProduto>(`/avaliacao-produto/${id}`, { method: "DELETE" }, true),
};

type ProdutoEdicao = { nome: string; descricao: string; preco: number; estoque: number; categoriaId?: number };

export const produtosApi = {
  buscar: async (id: number, signal?: AbortSignal) =>
    parseProducts([await request<unknown>(`/produto/${id}`, { signal })])[0],
  atualizar: async (id: number, data: ProdutoEdicao) =>
    parseProducts([await request<unknown>(`/produto/${id}`, {
      method: "PATCH",
      body: json(data),
    }, true)])[0],
  excluir: (id: number) => request<unknown>(`/produto/${id}`, { method: "DELETE" }, true),
  listar: (signal?: AbortSignal, lojaId?: number) => getProducts(signal, lojaId),
  criar: (data: {
    lojaId: number;
    categoriaId: number;
    nome: string;
    descricao?: string;
    preco: number;
    estoque: number;
    ativo?: boolean;
    imagens?: string[];
  }) => request<Product>("/produto", { method: "POST", body: json(data) }, true),
  uploadImagens: (files: File[]) => uploadFiles("/produto/upload", files),
};

export * as userApi from "./profile-api";
