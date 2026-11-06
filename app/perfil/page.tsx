"use client";

<<<<<<< HEAD
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileScreen } from "../stock-profile/ProfileScreen";
import { ProfileApiError, changePassword, deleteAccount, loadProfile, saveProfile } from "../stock-profile/profile-api";
import { clearSession, readSession, SESSION_CHANGED } from "../stock-profile/session";
import type { Profile, ProfileActions } from "../stock-profile/types";
import styles from "../stock-profile/profile.module.css";
=======
import { useEffect, useRef, useState } from "react";
import { ProfileScreen } from "../stock-profile/ProfileScreen";
import type { Product, Profile } from "../stock-profile/types";
>>>>>>> dev

type State = { kind: "loading" } | { kind: "signed-out" } | { kind: "error"; message: string } | { kind: "ready"; profile: Profile };

export default function ProfilePage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });
  const pending = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const session = readSession();
    if (!session) { setState({ kind: "signed-out" }); return; }
    setState({ kind: "loading" });
    try { const profile = await loadProfile(session, controller.signal); if (!controller.signal.aborted) setState({ kind: "ready", profile }); }
    catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof ProfileApiError && error.status === 401) { clearSession(); setState({ kind: "signed-out" }); }
      else setState({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível carregar seu perfil." });
    }
  }, []);

  useEffect(() => {
    // A montagem inicia a sincronização com a sessão do navegador e a API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    const onSessionChange = () => { void reload(); };
    const onStorage = (event: StorageEvent) => { if (event.key === "token" || event.key === null) void reload(); };
    window.addEventListener(SESSION_CHANGED, onSessionChange);
    window.addEventListener("storage", onStorage);
    return () => { pending.current?.abort(); window.removeEventListener(SESSION_CHANGED, onSessionChange); window.removeEventListener("storage", onStorage); };
  }, [reload]);

  async function withSession<T>(operation: (session: NonNullable<ReturnType<typeof readSession>>) => Promise<T>): Promise<T> {
    const session = readSession();
    if (!session) { setState({ kind: "signed-out" }); throw new Error("Entre novamente para continuar."); }
    try { return await operation(session); }
    catch (error) { if (error instanceof ProfileApiError && error.status === 401) { clearSession(); setState({ kind: "signed-out" }); } throw error; }
  }

  if (state.kind !== "ready") return <main className={`${styles.root} ${styles.pageState}`}>
    {state.kind === "loading" ? <p role="status">Carregando seu perfil…</p> : state.kind === "signed-out" ? <>
      <h1>Seu perfil</h1><p>Entre na sua conta para visualizar e editar seus dados.</p><Link className={styles.primary} href="/login">Entrar</Link>
    </> : <><h1>Não foi possível carregar seu perfil</h1><p role="alert">{state.message}</p><button className={styles.primary} type="button" onClick={() => void reload()}>Tentar novamente</button></>}
  </main>;

  const profile = state.profile;
  const actions: ProfileActions = {
    onSave: data => withSession(async session => { const updated = await saveProfile(session, data); setState({ kind: "ready", profile: updated }); return updated; }),
    onChangePassword: data => withSession(session => changePassword(session, profile.email, data)),
    onDeleteAccount: () => withSession(async session => { await deleteAccount(session); clearSession(); router.replace("/login"); }),
  };

  return <ProfileScreen key={profile.id} profile={profile} products={[]} isOwnProfile avatarEditing={false}
    emptyProductsMessage="A lista de produtos deste perfil ainda não está disponível."
    {...actions} />;
}
