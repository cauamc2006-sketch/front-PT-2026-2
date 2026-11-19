import { API_URL } from "./config";
import type { ProfileSession } from "./session";
import type { PasswordChange, Profile, ProfileUpdate, Store } from "@/app/components/profile/types";

export class ProfileApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ProfileApiError";
  }
}

async function request(path: string, session: ProfileSession, options: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
        ...options.headers,
      },
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ProfileApiError("Não foi possível acessar sua conta. Confira a conexão e tente novamente.", 0);
  }
  if (!response.ok) {
    const messages: Record<number, string> = {
      400: "Confira os dados informados e tente novamente.",
      401: "Sua sessão expirou. Entre novamente.",
      403: "Você não tem permissão para realizar essa ação.",
      404: "Não foi possível encontrar sua conta.",
      409: "Esse username ou e-mail já está em uso.",
    };
    throw new ProfileApiError(messages[response.status] ?? "Não foi possível concluir a operação. Tente novamente.", response.status);
  }
  return response;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ProfileApiError("A resposta recebida não pôde ser reconhecida. Tente novamente.", 502);
  }
}

function parseProfile(data: unknown, session: ProfileSession): Profile {
  if (
    !data ||
    typeof data !== "object" ||
    !("id" in data) ||
    Number(data.id) !== session.userId ||
    !("nome" in data) ||
    typeof data.nome !== "string" ||
    !("username" in data) ||
    typeof data.username !== "string" ||
    !("email" in data) ||
    typeof data.email !== "string"
  ) {
    throw new ProfileApiError("Os dados recebidos não correspondem ao seu perfil.", 502);
  }
  const avatar = "fotoPerfilUrl" in data && typeof data.fotoPerfilUrl === "string" ? data.fotoPerfilUrl : undefined;
  let avatarUrl: string | undefined;
  if (avatar) {
    try {
      const url = new URL(avatar, `${API_URL}/`);
      if (["http:", "https:"].includes(url.protocol)) avatarUrl = url.href;
    } catch {
      /* Usa iniciais */
    }
  }
  const rawStores: unknown[] = "lojas" in data && Array.isArray(data.lojas) ? data.lojas : [];
  const stores = rawStores.flatMap(store => {
    if (!store || typeof store !== "object" || !("id" in store) || typeof store.id !== "number" || !("nome" in store) || typeof store.nome !== "string") return [];
    return [{
      id: store.id,
      name: store.nome,
      description: "descricao" in store && typeof store.descricao === "string" ? store.descricao : undefined,
      logoUrl: "logoUrl" in store && typeof store.logoUrl === "string" ? store.logoUrl : undefined,
      bannerUrl: "bannerUrl" in store && typeof store.bannerUrl === "string" ? store.bannerUrl : undefined,
      stickerUrl: "stickerUrl" in store && typeof store.stickerUrl === "string" ? store.stickerUrl : undefined,
    }];
  });
  const products = rawStores.flatMap(store => {
    if (!store || typeof store !== "object" || !("produtos" in store) || !Array.isArray(store.produtos)) return [];
    const storeName = "nome" in store && typeof store.nome === "string" ? store.nome : undefined;
    const storeLogoUrl = "logoUrl" in store && typeof store.logoUrl === "string" ? store.logoUrl : undefined;
    return (store.produtos as unknown[]).flatMap((product: unknown) => {
      if (!product || typeof product !== "object" || !("id" in product) || typeof product.id !== "number" || !("nome" in product) || typeof product.nome !== "string") return [];
      const images = "imagens" in product && Array.isArray(product.imagens) ? (product.imagens as unknown[]).flatMap((image: unknown) =>
        image && typeof image === "object" && "id" in image && typeof image.id === "number" && "urlImagem" in image && typeof image.urlImagem === "string" && "ordem" in image && typeof image.ordem === "number"
          ? [{ id: image.id, urlImagem: image.urlImagem, ordem: image.ordem }] : []) : [];
      images.sort((a, b) => a.ordem - b.ordem);
      return [{ id: String(product.id), name: product.nome, price: "preco" in product ? Number(product.preco) : 0, available: !("ativo" in product) || product.ativo !== false, imageUrl: images[0]?.urlImagem, images, storeName, storeLogoUrl }];
    });
  });
  return { id: String(data.id), name: data.nome, username: data.username, email: data.email, avatarUrl, stores, products };
}

export async function loadProfile(session: ProfileSession, signal?: AbortSignal): Promise<Profile> {
  return parseProfile(await readJson(await request(`/user/me/profile`, session, { signal })), session);
}

export async function saveProfile(session: ProfileSession, data: ProfileUpdate): Promise<Profile> {
  if (data.avatarFile) throw new ProfileApiError("A alteração de foto ainda não está disponível.", 400);
  return parseProfile(
    await readJson(
      await request(`/user/${session.userId}`, session, {
        method: "PATCH",
        body: JSON.stringify({ name: data.name.trim(), username: data.username.trim(), email: data.email.trim() }),
      })
    ),
    session
  );
}

export async function changePassword(session: ProfileSession, data: PasswordChange): Promise<void> {
  await request(`/user/me/password`, session, { method: "PATCH", body: JSON.stringify({ senhaAtual: data.currentPassword, novaSenha: data.newPassword }) });
}

export async function createStore(session: ProfileSession, data: { name: string; description?: string; logoUrl?: string; bannerUrl?: string; stickerUrl?: string }): Promise<Store> {
  const payload = await readJson(await request('/loja', session, {
    method: 'POST',
    body: JSON.stringify({ nome: data.name.trim(), descricao: data.description?.trim() || undefined, logoUrl: data.logoUrl?.trim() || undefined, bannerUrl: data.bannerUrl?.trim() || undefined, stickerUrl: data.stickerUrl?.trim() || undefined }),
  }));
  if (!payload || typeof payload !== 'object' || !('id' in payload) || typeof payload.id !== 'number' || !('nome' in payload) || typeof payload.nome !== 'string') {
    throw new ProfileApiError('A loja foi criada, mas a resposta recebida é inválida.', 502);
  }
  return { id: payload.id, name: payload.nome, description: 'descricao' in payload && typeof payload.descricao === 'string' ? payload.descricao : undefined, logoUrl: 'logoUrl' in payload && typeof payload.logoUrl === 'string' ? payload.logoUrl : undefined, bannerUrl: 'bannerUrl' in payload && typeof payload.bannerUrl === 'string' ? payload.bannerUrl : undefined, stickerUrl: 'stickerUrl' in payload && typeof payload.stickerUrl === 'string' ? payload.stickerUrl : undefined };
}

export async function deleteAccount(session: ProfileSession): Promise<void> {
  await request(`/user/${session.userId}`, session, { method: "DELETE" });
}
