import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Perfil | STOCK.IO", description: "Perfil do usuário no STOCK.IO." };

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
