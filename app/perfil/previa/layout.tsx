import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Prévia do perfil | STOCK.IO" };

export default function PreviewLayout({ children }: { children: ReactNode }) {
  return children;
}
