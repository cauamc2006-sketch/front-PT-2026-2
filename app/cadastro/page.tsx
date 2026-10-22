'use client'

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Cadastro() {
  const router = useRouter()
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [erro, setErro] = useState("")
  const [nome, setNome] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")

  function lidarComCadastro(evento: React.FormEvent) {
    evento.preventDefault() 
    setErro("") 

    if (!nome || !username || !email || !senha || !confirmarSenha) {
      setErro("Por favor, preencha todos os campos obrigatórios.")
      return 
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem. Tente novamente.")
      return 
    }

    router.push('/login')
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
              className="bg-[#6A38F3] text-white font-[600] text-[25px] leading-none tracking-normal rounded-[76px] w-full py-4 mt-10 hover:bg-[#6D28D9] transition-colors"
            >
              CRIAR CONTA
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