"use client";

import { useEffect, useRef, useState } from "react";
import { ProfileScreen } from "../../stock-profile/ProfileScreen";
import { beautyProducts } from "../../stock-profile/catalog";
import type { Profile } from "../../stock-profile/types";
import styles from "../../stock-profile/profile.module.css";

/** Prévia visual separada do perfil real: nenhuma chamada à API. */
export default function ProfilePreviewPage() {
  const [profile, setProfile] = useState<Profile>({ id: "preview", name: "Selena Gomez", username: "selenagomez", email: "selenamariagomez@rare.com", avatarUrl: "/stock-profile/avatar-reference.svg" });
  const avatar = useRef<string | undefined>(undefined);
  useEffect(() => () => { if (avatar.current) URL.revokeObjectURL(avatar.current); }, []);
  return <>
    <p className={styles.srOnly} role="note">Prévia visual com dados de demonstração. As alterações não são salvas no servidor.</p>
    <div className={styles.root}>
      <ProfileScreen profile={profile} products={beautyProducts} isOwnProfile
        onSave={async data => {
          let avatarUrl = profile.avatarUrl;
          if (data.avatarFile) { if (avatar.current) URL.revokeObjectURL(avatar.current); avatarUrl = URL.createObjectURL(data.avatarFile); avatar.current = avatarUrl; }
          const updated = { ...profile, name: data.name, username: data.username, email: data.email, avatarUrl };
          setProfile(updated);
          return updated;
        }}
        onChangePassword={async () => { throw new Error("Esta é uma prévia. Altere a senha no seu perfil real."); }}
        onDeleteAccount={async () => { throw new Error("Esta é uma prévia. Nenhuma conta foi excluída."); }}
      />
    </div>
  </>;
}
