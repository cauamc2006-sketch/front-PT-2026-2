"use client";

import { useEffect, useRef, useState } from "react";
import { ProfileScreen } from "../../components/stock-profile/ProfileScreen";
import type { Product, Profile } from "../../components/stock-profile/types";

const initialProfile: Profile = { id: "demo", name: "Selena Gomez", username: "selenagomez", email: "selenamariagomez@exemplo.com" };
const products: Product[] = [
  { id: "1", name: "Bronzer", price: 254.99, imageUrl: "/stock-profile/bronzer.svg" },
  { id: "2", name: "Blush", price: 199.99, imageUrl: "/stock-profile/blush.svg" },
  { id: "3", name: "Perfume Rare", price: 599.90, imageUrl: "/stock-profile/perfume.svg" },
  { id: "4", name: "Iluminador", price: 249.90, imageUrl: "/stock-profile/iluminador.svg" },
  { id: "5", name: "Mini Blush", price: 99.99, imageUrl: "/stock-profile/mini-blush.svg" },
  { id: "6", name: "Blush Coral", price: 149.90, imageUrl: "/stock-profile/blush.svg" },
];

/** Demonstração sem endpoints inventados e sem armazenar senhas. */
export default function ProfilePage() {
  const [profile, setProfile] = useState(initialProfile);
  const avatarObjectUrl = useRef<string | undefined>(undefined);
  useEffect(() => () => { if (avatarObjectUrl.current) URL.revokeObjectURL(avatarObjectUrl.current); }, []);
  return <>
    <aside style={{ margin: 0, padding: "12px 20px", fontSize: 14, background: "#eee7ff", color: "#34216b" }}>
      Demonstração: alterações do perfil ficam somente nesta página e somem ao recarregar. Senha e exclusão precisam da API.
    </aside>
    <ProfileScreen key={profile.id} profile={profile} products={products} isOwnProfile
      onSave={async data => {
        let avatarUrl = profile.avatarUrl;
        if (data.avatarFile) {
          if (avatarObjectUrl.current) URL.revokeObjectURL(avatarObjectUrl.current);
          avatarUrl = URL.createObjectURL(data.avatarFile);
          avatarObjectUrl.current = avatarUrl;
        }
        const updated: Profile = { ...profile, name: data.name, username: data.username, email: data.email, avatarUrl };
        setProfile(updated);
        return updated;
      }}
      onChangePassword={async () => { throw new Error("Conecte a API para alterar a senha. Nenhuma senha foi salva."); }}
      onDeleteAccount={async () => { throw new Error("Conecte a API para excluir a conta. Nenhuma conta foi excluída."); }}
    />
  </>;
}
