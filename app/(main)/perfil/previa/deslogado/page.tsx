import type { Metadata } from "next";
import { ProfilePreview } from "@/app/components/profile";

export const metadata: Metadata = { title: "Prévia do perfil deslogado | STOCK.IO" };

/** Demonstra o perfil público sem iniciar ou encerrar uma sessão real. */
export default function SignedOutProfilePreviewPage() {
  return <ProfilePreview isOwnProfile={false} />;
}
