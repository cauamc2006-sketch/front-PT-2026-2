import type { PasswordChange, Profile, ProfileUpdate } from "./types";
import type { ProfileSession } from "./session";

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/+$/, "");

export class ProfileApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); this.name = "ProfileApiError"; }
}

async function request(path: string, session: ProfileSession, options: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, { ...options, cache: "no-store",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}`, ...options.headers } });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ProfileApiError("Não foi possível acessar sua conta. Confira a conexão e tente novamente.", 0);
  }
  if (!response.ok) {
    const messages: Record<number, string> = {
      400: "Confira os dados informados e tente novamente.", 401: "Sua sessão expirou. Entre novamente.",
      403: "Você não tem permissão para realizar essa ação.", 404: "Não foi possível encontrar sua conta.",
      409: "Esse username ou e-mail já está em uso.",
    };
    throw new ProfileApiError(messages[response.status] ?? "Não foi possível concluir a operação. Tente novamente.", response.status);
  }
  return response;
}

async function readJson(response: Response): Promise<unknown> {
  try { return await response.json(); }
  catch { throw new ProfileApiError("A resposta recebida não pôde ser reconhecida. Tente novamente.", 502); }
}

function parseProfile(data: unknown, session: ProfileSession): Profile {
  if (!data || typeof data !== "object" || !("id" in data) || Number(data.id) !== session.userId ||
    !("nome" in data) || typeof data.nome !== "string" || !("username" in data) || typeof data.username !== "string" ||
    !("email" in data) || typeof data.email !== "string") {
    throw new ProfileApiError("Os dados recebidos não correspondem ao seu perfil.", 502);
  }
  const avatar = "fotoPerfilUrl" in data && typeof data.fotoPerfilUrl === "string" ? data.fotoPerfilUrl : undefined;
  let avatarUrl: string | undefined;
  if (avatar) {
    try { const url = new URL(avatar, `${apiUrl}/`); if (["http:", "https:"].includes(url.protocol)) avatarUrl = url.href; } catch { /* Usa iniciais. */ }
  }
  return { id: String(data.id), name: data.nome, username: data.username, email: data.email, avatarUrl };
}

export async function loadProfile(session: ProfileSession, signal?: AbortSignal): Promise<Profile> {
  return parseProfile(await readJson(await request(`/user/${session.userId}`, session, { signal })), session);
}

export async function saveProfile(session: ProfileSession, data: ProfileUpdate): Promise<Profile> {
  if (data.avatarFile) throw new ProfileApiError("A alteração de foto ainda não está disponível.", 400);
  return parseProfile(await readJson(await request(`/user/${session.userId}`, session, {
    method: "PATCH", body: JSON.stringify({ name: data.name.trim(), username: data.username.trim(), email: data.email.trim() }),
  })), session);
}

export async function changePassword(session: ProfileSession, email: string, data: PasswordChange): Promise<void> {
  // O PATCH existente não verifica a senha antiga. Reautentica antes de alterar.
  let response: Response;
  try { response = await fetch(`${apiUrl}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, senha: data.currentPassword }) }); }
  catch { throw new ProfileApiError("Não foi possível confirmar sua senha. Tente novamente.", 0); }
  if (response.status === 401) throw new ProfileApiError("A senha antiga está incorreta.", 400);
  if (!response.ok) throw new ProfileApiError("Não foi possível confirmar sua senha. Tente novamente.", response.status);
  const authentication = await readJson(response);
  if (!authentication || typeof authentication !== "object" || !("userId" in authentication) || authentication.userId !== session.userId) {
    throw new ProfileApiError("Não foi possível confirmar sua identidade.", 403);
  }
  await request(`/user/${session.userId}`, session, { method: "PATCH", body: JSON.stringify({ senha: data.newPassword }) });
}

export async function deleteAccount(session: ProfileSession): Promise<void> {
  // Não lê nem expõe o corpo de DELETE (o servidor atual retorna o registro removido).
  await request(`/user/${session.userId}`, session, { method: "DELETE" });
}
