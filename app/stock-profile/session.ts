export const SESSION_CHANGED = "stockio:session-changed";

export interface ProfileSession { token: string; userId: number }

/** O sub seleciona o registro; autorização continua sendo feita pela API. */
export function readSession(): ProfileSession | null {
  if (typeof window === "undefined") return null;
  try {
    const token = window.localStorage.getItem("token");
    if (!token) return null;
    const encoded = token.split(".")[1];
    if (!encoded) return null;
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const payload: unknown = JSON.parse(window.atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    if (!payload || typeof payload !== "object" || !("sub" in payload)) return null;
    if (typeof payload.sub !== "number" && typeof payload.sub !== "string") return null;
    const userId = Number(payload.sub);
    if (!Number.isSafeInteger(userId) || userId <= 0) return null;
    if ("exp" in payload && (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now())) return null;
    return { token, userId };
  } catch { return null; }
}

export function clearSession() {
  try { window.localStorage.removeItem("token"); }
  catch { /* A interface continua encerrando o acesso mesmo se o armazenamento falhar. */ }
  window.dispatchEvent(new Event(SESSION_CHANGED));
}
