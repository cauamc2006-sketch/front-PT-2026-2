"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Icon } from "./Icons";
import { clearSession, readSession, SESSION_CHANGED } from "./session";
import styles from "./profile.module.css";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(SESSION_CHANGED, listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener(SESSION_CHANGED, listener); };
}
function snapshot() { return readSession()?.token ?? null; }
function serverSnapshot() { return null; }

/** Variante do cabeçalho exclusiva do perfil. Não altera a navbar do Moretti. */
export function ProfileNavbar({ storesHref }: { storesHref?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const preview = pathname === "/perfil/previa";
  const authenticated = preview || Boolean(token);
  return <header className={styles.navbar}>
    <nav className={styles.navContent} aria-label="Navegação principal">
      <Link href="/" className={styles.brandLink}><img src="/stock-profile/logo-reference.svg" width="226" height="52" alt="STOCK.IO — Página inicial" /></Link>
      <div className={styles.navActions}>
        <Link href="/" className={styles.navIcon} aria-label="Produtos" title="Produtos"><Icon name="bag" /></Link>
        {storesHref ? <Link href={storesHref} className={styles.navIcon} aria-label="Lojas" title="Lojas"><Icon name="store" /></Link> : <button type="button" className={styles.navIcon} disabled aria-label="Lojas — em breve" title="Lojas — em breve"><Icon name="store" /></button>}
        {authenticated ? <>
          <Link href={preview ? "/perfil/previa" : "/perfil"} aria-label="Meu perfil" aria-current="page" className={`${styles.navIcon} ${styles.activeProfile}`} title="Meu perfil"><Icon name="user" /></Link>
          <button type="button" className={styles.navIcon} aria-label="Sair da conta" title="Sair da conta" onClick={() => { clearSession(); router.replace("/login"); }}><Icon name="logout" /></button>
        </> : <Link href="/login" className={styles.signIn}>Entrar</Link>}
      </div>
    </nav>
  </header>;
}
