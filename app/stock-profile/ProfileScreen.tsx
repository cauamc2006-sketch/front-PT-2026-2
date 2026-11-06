"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "./Icons";
import { Avatar, ProfileModals } from "./ProfileModals";
import CardProduto from "../components/CardProduto";
import type { Product, Profile, ProfileActions } from "./types";
import styles from "./profile.module.css";

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
      <section className={`${styles.container} ${styles.products}`} aria-labelledby="stock-products-title">
        <div className={styles.sectionHeading}>
          <h2 id="stock-products-title">Produtos</h2>
          {products.length > 0 && (allProductsHref ? <a href={allProductsHref}>ver mais</a> : products.length > 5 ? <button type="button" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? "ver menos" : "ver mais"}</button> : null)}
        </div>
        {products.length ? <div className={styles.productGrid}>{visibleProducts.map(product => <CardProduto key={product.id} imagemUrl={product.imageUrl || "/Logo.png"} nome={product.name || "Produto"} preco={`R$ ${product.price || "0,00"}`} lojaLogo="/Logo.png" />)}</div> : <p className={styles.empty}>Nenhum produto cadastrado ainda.</p>}
      </section>
      <p role="status" className={notice ? styles.notice : styles.srOnly}>{notice}</p>
    </main>
    {editing && isOwnProfile && <ProfileModals profile={profile} avatarEditing={avatarEditing} {...actions} onClose={() => setEditing(false)} onNotice={setNotice} />}
  </div>;
}
