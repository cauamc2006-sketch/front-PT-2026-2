'use client'

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/+$/, "")

export default function Cadastro() {
  const router = useRouter()
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [erro, setErro] = useState("")
  const [nome, setNome] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [carregando, setCarregando] = useState(false);

  async function lidarComCadastro(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault() 
    setErro("") 

    const nomeCompleto = nome.trim()
    const nomeUsuario = username.trim()
    const emailNormalizado = email.trim()

    if (!nomeCompleto || !nomeUsuario || !emailNormalizado || !senha || !confirmarSenha) {
      setErro("Por favor, preencha todos os campos obrigatórios.")
      return 
    }

    if (senha.length < 8) {
      setErro("A senha deve ter no mínimo 8 caracteres.")
      return
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem. Tente novamente.");
      return; 
    }

    setCarregando(true)
    try {
      let response: Response
      try {
        response = await fetch(`${apiUrl}/user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: nomeUsuario,
            name: nomeCompleto,
            email: emailNormalizado,
            senha,
          }),
        })
      } catch {
        setErro("Não foi possível conectar à API. Verifique se o servidor está online.")
        return
      }

      if (!response.ok) {
        let mensagem = ""
        try {
          const resultado: unknown = await response.json()
          if (
            typeof resultado === "object" &&
            resultado !== null &&
            "message" in resultado
          ) {
            const mensagemApi = resultado.message
            if (typeof mensagemApi === "string") {
              mensagem = mensagemApi
            } else if (
              Array.isArray(mensagemApi) &&
              mensagemApi.every((item): item is string => typeof item === "string")
            ) {
              mensagem = mensagemApi.join(" ")
            }
          }
        } catch {
          mensagem = ""
        }

        setErro(
          mensagem ||
            "Não foi possível criar a conta. Confira os dados e tente novamente.",
        )
        return
      }

      router.push("/login")
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F3E4] flex items-center justify-center p-6">

      <div className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-20 w-full max-w-[1400px]">
        <div className="bg-[#171918] text-white p-10 rounded-[48px] w-full max-w-[654px] shadow-2xl">

          <h1 className="text-[44px] font-[800] leading-none tracking-normal text-[#F6F3E4] text-center mb-[32] uppercase">
            Crie sua conta
          </h1>

          <form onSubmit={lidarComCadastro} className="flex flex-col gap-[15px] w-full">

            <div className="flex flex-col gap-[15px] w-full">
              <input
                type="text"
                placeholder="Nome Completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-[#F6F3E4] rounded-[72px] w-full px-6 py-4 outline-none focus:ring-2 focus:ring-[#7C3AED] font-light text-[25px] leading-none tracking-normal text-[#858585] placeholder-[#858585]"
              />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-[#F6F3E4] rounded-[72px] w-full px-6 py-4 outline-none focus:ring-2 focus:ring-[#7C3AED] font-light text-[25px] leading-none tracking-normal text-[#858585] placeholder-[#858585]"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#F6F3E4] rounded-[72px] w-full px-6 py-4 outline-none focus:ring-2 focus:ring-[#7C3AED] font-light text-[25px] leading-none tracking-normal text-[#858585] placeholder-[#858585]"
              />
              <div className="relative w-full">
                <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="bg-[#F6F3E4] rounded-[72px] w-full px-6 py-4 outline-none focus:ring-2 focus:ring-[#7C3AED] font-light text-[25px] leading-none tracking-normal text-[#858585] placeholder-[#858585]"
                />
                <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-6 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  <Image src="/olho.svg" alt="Mostrar/Ocultar Senha" width={24} height={24} />
                </button>
              </div>
              <div className="relative w-full">
                <input
                type={mostrarConfirmarSenha ? "text" : "password"}
                placeholder="Confirmar Senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="bg-[#F6F3E4] rounded-[72px] w-full px-6 py-4 outline-none focus:ring-2 focus:ring-[#7C3AED] font-light text-[25px] leading-none tracking-normal text-[#858585] placeholder-[#858585]"
                />
                <button
                type="button"
                onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                className="absolute right-6 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  <Image src="/olho.svg" alt="Mostrar/Ocultar Senha" width={24} height={24} />
                </button>
              </div>
            </div>

            {erro && (
              <p className="text-red-500 text-sm font-semibold text-center mt-4">{erro}</p>
            )}

            <button 
              type="submit" 
              disabled={carregando} 
              className={`bg-[#6A38F3] text-white font-[600] text-[25px] leading-none tracking-normal rounded-[76px] w-full py-4 mt-10 transition-colors ${
                carregando ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#6D28D9]'
              }`}
            >
              {carregando ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}
            </button>

            <div className="text-white font-light text-[25.38px] leading-none tracking-normal text-center mt-8">
              Já possui uma conta?{' '}
              <Link href="/login" className="text-[#6A38F3] font-medium hover:underline transition-colors">
                Login
              </Link>
            </div>

          </form>
        </div>

        <div className="hidden lg:flex flex-col items-center justify-center w-full max-w-[600px] gap-8">
          
          <div className="w-full flex justify-center">
            <Image 
              src="/logo.svg" 
              alt="Logo do sistema" 
              width={421} 
              height={267} 
              priority 
            />           
          </div>

          <div className="w-full flex justify-center">
            <Image 
            src="/boneco-cadastro.svg" 
            alt="Mascote de cadastro" 
            width={497} 
            height={1129} 
          />
          </div>

        </div>

      </div>

    </main>
  )
}