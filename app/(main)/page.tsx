"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("token");
    router.replace("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream px-6 text-center text-ink">
      <h1 className="text-4xl font-extrabold uppercase tracking-wide">
        Bem-vindo ao STOCK.IO
      </h1>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full bg-brand px-8 py-3 font-bold uppercase text-white transition-colors hover:bg-[#4a2fd6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Sair
      </button>
    </main>
  );
}
