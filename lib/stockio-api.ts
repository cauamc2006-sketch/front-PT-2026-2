import { API_URL } from "./config";
import { readSession } from "./session";

export type Loja = { id: number; nome: string; descricao?: string | null; logoUrl?: string | null; usuarioId: number };
export type Comentario = { id: number; conteudo: string; usuarioId: number; avaliacaoLojaId?: number | null; avaliacaoProdutoId?: number | null; usuario?: { id: number; nome: string; username: string; fotoPerfilUrl?: string | null } };
export type CategoriaBackend = {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  imagemUrl?: string | null;
  categoriaPaiId?: number | null;
  subcategorias?: CategoriaBackend[];
};

export class StockioApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = "StockioApiError"; }
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
      headers: { "Content-Type": "application/json", ...(token && authenticated ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
    });
  } catch { throw new StockioApiError("Não foi possível conectar ao backend.", 0); }
  if (!response.ok) {
    let message = response.status === 401 ? "Sessão inválida ou expirada." :
      response.status === 403 ? "Você não tem permissão para esta operação." :
      response.status === 404 ? "Registro não encontrado." : `Erro HTTP ${response.status}.`;
    try {
      const body = await response.json() as { message?: string | string[] };
      if (body.message) message = Array.isArray(body.message) ? body.message.join(" ") : body.message;
    } catch { /* resposta sem JSON */ }
    throw new StockioApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
const json = (value: unknown) => JSON.stringify(value);

export const lojasApi = {
  listar: () => request<Loja[]>("/loja"),
  buscar: (id: number) => request<Loja>(`/loja/${id}`),
  criar: (data: { nome: string; descricao?: string; logoUrl?: string }) => request<Loja>("/loja", { method: "POST", body: json(data) }, true),
  atualizar: (id: number, data: Partial<{ nome: string; descricao: string; logoUrl: string }>) => request<Loja>(`/loja/${id}`, { method: "PATCH", body: json(data) }, true),
  excluir: (id: number) => request<Loja>(`/loja/${id}`, { method: "DELETE" }, true),
};

export const categoriasApi = {
  listar: (raiz?: boolean) => request<CategoriaBackend[]>(`/categorias${raiz ? "?raiz=true" : ""}`),
  buscar: (id: number) => request<CategoriaBackend>(`/categorias/${id}`),
  buscarSubcategorias: (categoriaPaiId: number) => request<CategoriaBackend[]>(`/categorias?categoriaPaiId=${categoriaPaiId}`),
};

export const comentariosApi = {
  listar: (filtro?: { avaliacaoLojaId?: number; avaliacaoProdutoId?: number }) => {
    const params = new URLSearchParams();
    if (filtro?.avaliacaoLojaId) params.set("avaliacaoLojaId", String(filtro.avaliacaoLojaId));
    if (filtro?.avaliacaoProdutoId) params.set("avaliacaoProdutoId", String(filtro.avaliacaoProdutoId));
    return request<Comentario[]>(`/comentarios${params.size ? `?${params}` : ""}`);
  },
  buscar: (id: number) => request<Comentario>(`/comentarios/${id}`),
  criar: (data: { conteudo: string; avaliacaoLojaId?: number; avaliacaoProdutoId?: number }) => request<Comentario>("/comentarios", { method: "POST", body: json(data) }, true),
  atualizar: (id: number, conteudo: string) => request<Comentario>(`/comentarios/${id}`, { method: "PATCH", body: json({ conteudo }) }, true),
  excluir: (id: number) => request<Comentario>(`/comentarios/${id}`, { method: "DELETE" }, true),
};

import { getProducts, parseProducts, formatPrice, type Product } from "./products";
export { getProducts, parseProducts, formatPrice, type Product };

export const produtosApi = {
  listar: (signal?: AbortSignal) => getProducts(signal),
};

export * as userApi from "./profile-api";
