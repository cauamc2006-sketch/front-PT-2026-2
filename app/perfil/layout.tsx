import type { ReactNode } from "react";
import type { Metadata } from "next";
import { ProfileNavbar } from "../stock-profile/ProfileNavbar";

export const metadata: Metadata = { title: "Perfil | STOCK.IO", description: "Perfil do usuário no STOCK.IO." };

/** Cabeçalho da área de perfil, independente das outras telas. */
export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <><ProfileNavbar />{children}</>;
}
