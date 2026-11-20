export const SESSION_CHANGED = "stockio:session-changed";

export interface ProfileSession {
  token: string;
  userId: number;
}

/**
 * Lê e valida a sessão ativa a partir do token JWT salvo no localStorage.
 */
export function readSession(): ProfileSession | null {
  if (typeof window === "undefined") return null;
  try {
    const token = window.localStorage.getItem("token");
    if (!token) return null;
    const encoded = token.split(".")[1];
    if (!encoded) return null;
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const payload: unknown = JSON.parse(
      window.atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))
    );
    if (!payload || typeof payload !== "object" || !("sub" in payload)) return null;
    if (typeof payload.sub !== "number" && typeof payload.sub !== "string") return null;
    const userId = Number(payload.sub);
    if (!Number.isSafeInteger(userId) || userId <= 0) return null;
    if ("exp" in payload && (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now())) {
      return null;
    }
    return { token, userId };
  } catch {
    return null;
  }
}

/**
 * Salva o token JWT na sessão do navegador e notifica os componentes reativos (ex: Navbar).
 */
export function saveSession(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("token", token);
  } catch {
    /* fallback se o localStorage estiver indisponível */
  }
  window.dispatchEvent(new Event(SESSION_CHANGED));
}

/**
 * Remove a sessão do navegador e notifica os componentes reativos.
 */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem("token");
  } catch {
    /* fallback se o localStorage estiver indisponível */
  }
  window.dispatchEvent(new Event(SESSION_CHANGED));
}

export function subscribeSession(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener(SESSION_CHANGED, listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener(SESSION_CHANGED, listener);
  };
}
