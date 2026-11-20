"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProfileScreen } from "@/app/components/profile";
import type { Profile, ProfileActions } from "@/app/components/profile";
import styles from "@/app/components/profile/profile.module.css";
import {
  ProfileApiError,
  changePassword,
  createStore,
  deleteAccount,
  loadProfile,
  loadPublicProfile,
  saveProfile,
  uploadStoreImages,
} from "@/lib/profile-api";
import { clearSession, readSession, SESSION_CHANGED } from "@/lib/session";

type State =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "error"; message: string }
  | { kind: "ready"; profile: Profile; isOwn: boolean };

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawUsuarioId = searchParams.get("usuarioId");
  const targetUserId =
    rawUsuarioId && Number.isInteger(Number(rawUsuarioId)) && Number(rawUsuarioId) > 0
      ? Number(rawUsuarioId)
      : null;

  const [state, setState] = useState<State>({ kind: "loading" });
  const pending = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const session = readSession();

    const viewingOtherUser = targetUserId !== null && targetUserId !== session?.userId;

    if (!viewingOtherUser && !session) {
      setState({ kind: "signed-out" });
      return;
    }

    setState({ kind: "loading" });
    try {
      const profile = viewingOtherUser
        ? await loadPublicProfile(targetUserId, controller.signal)
        : await loadProfile(session!, controller.signal);
      if (!controller.signal.aborted) {
        setState({ kind: "ready", profile, isOwn: !viewingOtherUser });
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      if (!viewingOtherUser && error instanceof ProfileApiError && error.status === 401) {
        clearSession();
        setState({ kind: "signed-out" });
      } else {
        setState({
          kind: "error",
          message: error instanceof Error ? error.message : "Não foi possível carregar o perfil.",
        });
      }
    }
  }, [targetUserId]);

  useEffect(() => {
    // A montagem inicia a sincronização com a sessão do navegador e a API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    const onSessionChange = () => { void reload(); };
    const onStorage = (event: StorageEvent) => { if (event.key === "token" || event.key === null) void reload(); };
    window.addEventListener(SESSION_CHANGED, onSessionChange);
    window.addEventListener("storage", onStorage);
    return () => {
      pending.current?.abort();
      window.removeEventListener(SESSION_CHANGED, onSessionChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [reload]);

  async function withSession<T>(operation: (session: NonNullable<ReturnType<typeof readSession>>) => Promise<T>): Promise<T> {
    const session = readSession();
    if (!session) { setState({ kind: "signed-out" }); throw new Error("Entre novamente para continuar."); }
    try { return await operation(session); }
    catch (error) { if (error instanceof ProfileApiError && error.status === 401) { clearSession(); setState({ kind: "signed-out" }); } throw error; }
  }

  if (state.kind !== "ready") {
    return (
      <main className={`${styles.root} ${styles.pageState}`}>
        {state.kind === "loading" ? (
          <p role="status">Carregando perfil…</p>
        ) : state.kind === "signed-out" ? (
          <>
            <h1>Seu perfil</h1>
            <p>Entre na sua conta para visualizar e editar seus dados.</p>
            <Link className={styles.primary} href="/login">Entrar</Link>
          </>
        ) : (
          <>
            <h1>Não foi possível carregar o perfil</h1>
            <p role="alert">{state.message}</p>
            <button className={styles.primary} type="button" onClick={() => void reload()}>
              Tentar novamente
            </button>
          </>
        )}
      </main>
    );
  }

  const { profile, isOwn } = state;
  const actions: ProfileActions = {
    onSave: data => withSession(async session => { const updated = await saveProfile(session, data); setState({ kind: "ready", profile: updated, isOwn: true }); return updated; }),
    onChangePassword: data => withSession(session => changePassword(session, data)),
    onDeleteAccount: () => withSession(async session => { await deleteAccount(session); clearSession(); router.replace("/login"); }),
    onCreateStore: data => withSession(async session => {
      const selected = [
        ["logoUrl", data.logoFile],
        ["bannerUrl", data.bannerFile],
        ["stickerUrl", data.stickerFile],
      ] as const;
      const files = selected.flatMap(([, file]) => file ? [file] : []);
      const urls = files.length ? await uploadStoreImages(session, files) : [];
      let urlIndex = 0;
      const uploaded = Object.fromEntries(selected.flatMap(([field, file]) => file ? [[field, urls[urlIndex++]]] : []));
      const store = await createStore(session, { name: data.name, description: data.description, ...uploaded });
      setState(current => current.kind === "ready" ? { ...current, profile: { ...current.profile, stores: [store, ...current.profile.stores] } } : current);
      return store;
    }),
    onProductImagesChange: (productId, images) => setState(current => current.kind === "ready" ? {
      ...current,
      profile: {
        ...current.profile,
        products: current.profile.products.map(product => product.id === productId ? { ...product, images, imageUrl: images[0]?.urlImagem } : product),
      },
    } : current),
  };

  return (
    <ProfileScreen
      key={`${profile.id}-${isOwn}`}
      profile={profile}
      products={profile.products}
      isOwnProfile={isOwn}
      avatarEditing={false}
      emptyProductsMessage={
        isOwn
          ? "Nenhum produto cadastrado nas suas lojas."
          : "Nenhum produto cadastrado nas lojas deste usuário."
      }
      {...actions}
    />
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className={`${styles.root} ${styles.pageState}`}>
          <p role="status">Carregando perfil…</p>
        </main>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
