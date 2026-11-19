"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Icon } from "./Icons";
import { Avatar, ProfileModals } from "./ProfileModals";
import CardProduto from "../CardProduto";
import type { Product, Profile, ProfileActions } from "./types";
import styles from "./profile.module.css";
import { ProductImageManager } from "./ProductImageManager";

export type ProfileScreenProps = ProfileActions & {
  profile: Profile;
  products: Product[];
  isOwnProfile: boolean;
  navbar?: ReactNode;
  backHref?: string;
  allProductsHref?: string;
  avatarEditing?: boolean;
  emptyProductsMessage?: string;
};
  
export function ProfileScreen({ profile, products, isOwnProfile, navbar, backHref = "/", allProductsHref, avatarEditing = true, emptyProductsMessage = "Nenhum produto cadastrado ainda.", ...actions }: ProfileScreenProps) {
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [creatingStore, setCreatingStore] = useState(false);
  const [storeForm, setStoreForm] = useState({ name: "", description: "", logoUrl: "" });
  const [storeError, setStoreError] = useState("");
  const [storeBusy, setStoreBusy] = useState(false);
  const visibleProducts = showAll ? products : products.slice(0, 5);

  return <div className={styles.root}>
    {navbar}
    <main>
      <div className={styles.cover}>
        <div className={styles.container}><a href={backHref} className={styles.backLink} aria-label="Voltar"><Icon name="back" width={48} height={48} /></a></div>
      </div>
      <section className={`${styles.container} ${styles.profile}`} aria-labelledby="stock-profile-name">
        <div className={styles.avatar}><Avatar src={profile.avatarUrl} name={profile.name} /></div>
        {isOwnProfile && <button type="button" className={`${styles.primary} ${styles.editButton}`} onClick={() => { setNotice(""); setEditing(true); }}>Editar Perfil</button>}
        <h1 id="stock-profile-name">{profile.name}</h1>
        <p className={styles.detail}><Icon name="at" width={20} height={20} /><span>{profile.username.replace(/^@/, "")}</span></p>
        <p className={styles.detail}><Icon name="mail" width={14} height={14} /><span>{profile.email}</span></p>
      </section>
      {isOwnProfile && <section className={`${styles.container} ${styles.products}`} aria-labelledby="stock-stores-title">
        <div className={styles.sectionHeading}>
          <h2 id="stock-stores-title">Minhas lojas</h2>
          <button type="button" onClick={() => { setStoreError(""); setCreatingStore(true); }}>criar loja</button>
        </div>
        {profile.stores.length ? <ul>{profile.stores.map(store => <li key={store.id}><strong>{store.name}</strong>{store.description ? ` — ${store.description}` : ""}</li>)}</ul> : <p className={styles.empty}>Você ainda não criou uma loja.</p>}
      </section>}
      <section className={`${styles.container} ${styles.products}`} aria-labelledby="stock-products-title">
        <div className={styles.sectionHeading}>
          <h2 id="stock-products-title">Produtos</h2>
          {products.length > 0 && (allProductsHref ? <a href={allProductsHref}>ver mais</a> : products.length > 5 ? <button type="button" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? "ver menos" : "ver mais"}</button> : null)}
        </div>
        {products.length ? <div className={styles.productGrid}>{visibleProducts.map(product => <div key={product.id}><CardProduto imagemUrl={product.imageUrl || "/Logo.png"} nome={product.name || "Produto"} preco={`R$ ${product.price || "0,00"}`} lojaLogo={product.storeLogoUrl || "/Logo.png"} />{isOwnProfile && /^\d+$/.test(product.id) && <ProductImageManager productId={Number(product.id)} initialImages={product.images || []} />}</div>)}</div> : <p className={styles.empty}>{emptyProductsMessage}</p>}
      </section>
      <p role="status" className={notice ? styles.notice : styles.srOnly}>{notice}</p>
    </main>
    {editing && isOwnProfile && <ProfileModals profile={profile} avatarEditing={avatarEditing} {...actions} onClose={() => setEditing(false)} onNotice={setNotice} />}
    {creatingStore && <dialog open className={styles.dialog} aria-labelledby="create-store-title">
      <div className={styles.modalPanel}>
        <h2 id="create-store-title">Criar loja</h2>
        <form className={styles.modalForm} onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          if (storeBusy) return;
          const name = storeForm.name.trim();
          if (!name) { setStoreError("Informe o nome da loja."); return; }
          setStoreBusy(true); setStoreError("");
          void actions.onCreateStore({ name, description: storeForm.description, logoUrl: storeForm.logoUrl }).then(() => {
            setNotice("Loja criada com sucesso."); setCreatingStore(false); setStoreForm({ name: "", description: "", logoUrl: "" });
          }).catch(error => setStoreError(error instanceof Error ? error.message : "Não foi possível criar a loja.")).finally(() => setStoreBusy(false));
        }}>
          <fieldset disabled={storeBusy} className={styles.fieldset}>
            <div className={styles.fields}>
              <label>Nome<input required maxLength={255} value={storeForm.name} onChange={event => setStoreForm({ ...storeForm, name: event.target.value })} /></label>
              <label>Descrição<textarea maxLength={2000} value={storeForm.description} onChange={event => setStoreForm({ ...storeForm, description: event.target.value })} /></label>
              <label>URL do logo<input type="url" value={storeForm.logoUrl} onChange={event => setStoreForm({ ...storeForm, logoUrl: event.target.value })} /></label>
            </div>
            {storeError && <p role="alert" className={styles.error}>{storeError}</p>}
            <div className={styles.modalActions}><button className={styles.outline} type="button" onClick={() => setCreatingStore(false)}>Cancelar</button><button className={styles.primary} type="submit">{storeBusy ? "Criando…" : "Criar loja"}</button></div>
          </fieldset>
        </form>
      </div>
    </dialog>}
  </div>;
}
