"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
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

type StoreForm = { name: string; description: string; logoUrl: string; bannerUrl: string; stickerUrl: string };
const EMPTY_STORE: StoreForm = { name: "", description: "", logoUrl: "", bannerUrl: "", stickerUrl: "" };

function CreateStoreDialog({ busy, error, form, onChange, onClose, onSubmit }: { busy: boolean; error: string; form: StoreForm; onChange: (form: StoreForm) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = dialog.current; if (element && !element.open) element.showModal(); return () => element?.close(); }, []);

  return <dialog ref={dialog} className={`${styles.dialog} ${styles.storeDialog}`} aria-labelledby="create-store-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className={styles.modalPanel}>
      <button type="button" className={`${styles.iconButton} ${styles.closeButton}`} onClick={onClose} disabled={busy} aria-label="Fechar"><Icon name="close" /></button>
      <h2 id="create-store-title" className={styles.modalTitle}>Adicionar loja</h2>
      <p className={styles.modalIntro}>Cadastre os dados e a identidade visual da sua loja.</p>
      <form className={styles.modalForm} onSubmit={onSubmit}>
        <fieldset disabled={busy} className={styles.fieldset}>
          <div className={styles.fields}>
            <label>Nome da loja<input required maxLength={255} placeholder="Nome da loja" value={form.name} onChange={event => onChange({ ...form, name: event.target.value })} /></label>
            <label>Descrição<textarea maxLength={2000} rows={3} placeholder="Conte sobre a sua loja" value={form.description} onChange={event => onChange({ ...form, description: event.target.value })} /></label>
          </div>
          <div className={styles.storeVisuals} aria-label="Identidade visual da loja">
            {([['logoUrl', 'Logo'], ['bannerUrl', 'Banner'], ['stickerUrl', 'Sticker']] as const).map(([field, label]) => <label key={field}>
              <span>{label}</span><small>URL da imagem</small>
              <input type="url" placeholder="https://..." value={form[field]} onChange={event => onChange({ ...form, [field]: event.target.value })} />
            </label>)}
          </div>
          <p className={styles.help}>Categoria não é solicitada porque esse campo não existe no cadastro de loja da API.</p>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <div className={styles.modalActions}><button className={styles.outline} type="button" onClick={onClose}>Cancelar</button><button className={styles.primary} type="submit">{busy ? "Criando…" : "Adicionar loja"}</button></div>
        </fieldset>
      </form>
    </div>
  </dialog>;
}

function ProductImagesDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = dialog.current; if (element && !element.open) element.showModal(); return () => element?.close(); }, []);
  return <dialog ref={dialog} className={`${styles.dialog} ${styles.productImagesDialog}`} aria-labelledby="product-images-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className={styles.modalPanel}>
      <button type="button" className={`${styles.iconButton} ${styles.closeButton}`} onClick={onClose} aria-label="Fechar"><Icon name="close" /></button>
      <h2 id="product-images-title" className={styles.modalTitle}>Editar imagens</h2>
      <p className={styles.modalIntro}>{product.name}</p>
      <ProductImageManager productId={Number(product.id)} initialImages={product.images || []} />
      <button type="button" className={styles.primary} onClick={onClose}>Concluir</button>
    </div>
  </dialog>;
}
  
export function ProfileScreen({ profile, products, isOwnProfile, navbar, backHref = "/", allProductsHref, avatarEditing = true, emptyProductsMessage = "Nenhum produto cadastrado ainda.", ...actions }: ProfileScreenProps) {
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [creatingStore, setCreatingStore] = useState(false);
  const [storeForm, setStoreForm] = useState<StoreForm>(EMPTY_STORE);
  const [storeError, setStoreError] = useState("");
  const [storeBusy, setStoreBusy] = useState(false);
  const [imageProduct, setImageProduct] = useState<Product>();
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
        {profile.stores.length ? <ul className={styles.storeList}>{profile.stores.map(store => <li key={store.id}><span>{store.logoUrl ? <Image src={store.logoUrl} alt="" width={44} height={44} unoptimized /> : store.name.slice(0, 1).toUpperCase()}</span><div><strong>{store.name}</strong>{store.description && <p>{store.description}</p>}</div></li>)}</ul> : <p className={styles.empty}>Você ainda não criou uma loja.</p>}
      </section>}
      <section className={`${styles.container} ${styles.products}`} aria-labelledby="stock-products-title">
        <div className={styles.sectionHeading}>
          <h2 id="stock-products-title">Produtos</h2>
          {products.length > 0 && (allProductsHref ? <a href={allProductsHref}>ver mais</a> : products.length > 5 ? <button type="button" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? "ver menos" : "ver mais"}</button> : null)}
        </div>
        {products.length ? <div className={styles.productGrid}>{visibleProducts.map(product => <div key={product.id} className={styles.profileProduct}><CardProduto imagemUrl={product.imageUrl || "/Logo.png"} nome={product.name || "Produto"} preco={`R$ ${product.price || "0,00"}`} lojaLogo={product.storeLogoUrl || "/Logo.png"} />{isOwnProfile && /^\d+$/.test(product.id) && <button type="button" className={styles.manageImagesButton} onClick={() => setImageProduct(product)}>Gerenciar imagens</button>}</div>)}</div> : <p className={styles.empty}>{emptyProductsMessage}</p>}
      </section>
      <p role="status" className={notice ? styles.notice : styles.srOnly}>{notice}</p>
    </main>
    {editing && isOwnProfile && <ProfileModals profile={profile} avatarEditing={avatarEditing} {...actions} onClose={() => setEditing(false)} onNotice={setNotice} />}
    {creatingStore && <CreateStoreDialog busy={storeBusy} error={storeError} form={storeForm} onChange={setStoreForm} onClose={() => { if (!storeBusy) setCreatingStore(false); }} onSubmit={(event) => {
          event.preventDefault();
          if (storeBusy) return;
          const name = storeForm.name.trim();
          if (!name) { setStoreError("Informe o nome da loja."); return; }
          setStoreBusy(true); setStoreError("");
          void actions.onCreateStore({ name, description: storeForm.description, logoUrl: storeForm.logoUrl, bannerUrl: storeForm.bannerUrl, stickerUrl: storeForm.stickerUrl }).then(() => {
            setNotice("Loja criada com sucesso."); setCreatingStore(false); setStoreForm(EMPTY_STORE);
          }).catch(error => setStoreError(error instanceof Error ? error.message : "Não foi possível criar a loja.")).finally(() => setStoreBusy(false));
        }} />}
    {imageProduct && <ProductImagesDialog product={imageProduct} onClose={() => setImageProduct(undefined)} />}
  </div>;
}
