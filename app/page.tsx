"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";

const field =
  "h-14 w-full rounded-full bg-cream px-6 text-base text-ink placeholder:text-ink/50 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

function Logo({ className = "" }: { className?: string}) {
  return (
    <Image
      src="/logo.png"
      alt="STOCK.IO"
      width={280}
      height={64}
      priority
      style={{ height: 220, width: "auto" }}
      className={`w-auto ${className}`}
    />
  );
}

function Courier({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/entregador.png"
      alt="Entregador segurando uma caixa"
      width={420}
      height={620}
      priority
      className={className}
    />
  );
}

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (!email || !password) {
      setError("Preencha o e-mail e a senha para entrar.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      // TODO: chamar a API de login aqui (ex.: fetch("/api/login", ...))
      // e redirecionar com useRouter().push("/") em caso de sucesso.
    } catch {
      setError("Não foi possível entrar. Confira seus dados e tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[380px] text-center sm:max-w-[430px]">
      <h1 className="text-3xl font-extrabold uppercase tracking-wide text-cream sm:text-4xl">
        Bem vindo de volta!
      </h1>

      <form onSubmit={handleSubmit} noValidate className="mt-14 flex flex-col gap-5">
        <div>
          <label htmlFor="email" className="sr-only">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            className={field}
          />
        </div>

        <div className="relative">
          <label htmlFor="password" className="sr-only">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Senha"
            className={`${field} pr-14`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
            className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/60 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-brand"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
              {showPassword && <path d="M3 3l18 18" />}
            </svg>
          </button>
        </div>

        {error && (
          <p role="alert" className="text-base text-[#ff8f8f]">
            {error}
          </p>
        )}

        <Link
          href="/esqueci-senha"
          className="mx-auto -mt-1 text-base text-cream underline underline-offset-2 hover:text-lime focus-visible:outline-2 focus-visible:outline-brand"
        >
          Esqueceu sua senha?
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="h-14 w-full rounded-full bg-brand text-lg font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#4a2fd6] focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-8 text-left text-lg text-cream">
        Não possui uma conta?{" "}
      <Link
        href="/cadastro"
        className="font-medium text-[#8a73ff] hover:underline focus-visible:outline-2 focus-visible:outline-brand"
      >
        Cadastre-se
      </Link>
      </p>
  </div>
  );
}

export default function LoginPage() {
  return (
      <main className="flex min-h-screen flex-col bg-cream lg:grid lg:grid-cols-[1fr_minmax(0,0.9fr)] lg:gap-2 lg:pr-10 xl:pr-16">
      <section className="overflow-hidden px-6 pt-8 lg:px-16 lg:pt-14">
        <div className="flex h-full w-fit flex-col items-center">
          <Logo className="h-20 lg:h-28" />
          <Courier className="mt-auto hidden h-[calc(100vh-13rem)] w-auto lg:block" />
        </div>
      </section>
      <section className="mt-8 flex flex-1 flex-col items-center rounded-t-[40px] bg-ink px-6 pb-16 pt-16 lg:mt-36">
        <LoginForm />
      </section>
    </main>
  );
}