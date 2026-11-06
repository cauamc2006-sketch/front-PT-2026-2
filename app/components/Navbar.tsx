'use client'
import Link from 'next/link';
import Image from 'next/image';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  
  const [estaLogado, setEstaLogado] = useState(false);

  if (pathname === '/login' || pathname === '/cadastro') {
    return null;
  }

  const isLojasAtivo = pathname.startsWith('/lojas');
  const isCarrinhoAtivo = pathname.startsWith('/carrinho');
  const isPerfilAtivo = pathname.startsWith('/perfil');

  return (
    <nav className="bg-[#000000] w-full px-8 py-5 flex items-center justify-between shadow-md">
      <Link href="/">
        <Image 
          src="/logo-branca.png" 
          alt="STOCK.IO" 
          width={221} 
          height={43} 
          priority
          className="cursor-pointer hover:opacity-90 transition-opacity"
        />
      </Link>

      <div className="flex items-center gap-8">
        
        <div className="flex items-center gap-5">
          <Link href="/lojas" className="relative w-[38px] h-[38px] group">
            <Image 
              src="/Navbar/lsicon_store-filled.png" 
              alt="Lojas" 
              fill 
              className={`object-contain transition-opacity absolute ${isLojasAtivo ? 'opacity-0' : 'group-hover:opacity-0'}`} 
            />
            <Image 
              src="/Navbar/lsicon_store-filled-verde-stock.png" 
              alt="Lojas Ativo" 
              fill 
              className={`object-contain transition-opacity absolute ${isLojasAtivo ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} 
            />
          </Link>
          
          <Link href="/carrinho" className="relative w-[38px] h-[38px] group">
            <Image 
              src="/Navbar/ion_bag-sharp.png" 
              alt="Carrinho" 
              fill 
              className={`object-contain transition-opacity absolute ${isCarrinhoAtivo ? 'opacity-0' : 'group-hover:opacity-0'}`} 
            />
            <Image 
              src="/Navbar/ion_bag-sharp-verde-stock.png" 
              alt="Carrinho Ativo" 
              fill 
              className={`object-contain transition-opacity absolute ${isCarrinhoAtivo ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} 
            />
          </Link>
        </div>

        <div className="flex items-center gap-6 pl-6 border-l border-gray-600">
          {!estaLogado ? (
            <>
              <Link 
                href="/login" 
                className="text-[#6A38F3] font-bold text-lg uppercase tracking-wide hover:text-purple-400 transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/cadastro" 
                className="bg-[#6A38F3] text-white px-8 py-2.5 rounded-full font-bold text-lg uppercase tracking-wide hover:bg-[#5b2fd1] transition-colors shadow-lg"
              >
                Cadastre-se
              </Link>
            </>
          ) : (
            <>
              <Link href="/perfil" className="relative w-[38px] h-[38px] group">
                <Image 
                  src="/Navbar/ion_person.png" 
                  alt="Perfil" 
                  fill 
                  className={`object-contain transition-opacity absolute ${isPerfilAtivo ? 'opacity-0' : 'group-hover:opacity-0'}`} 
                />
                <Image 
                  src="/Navbar/ion_person-verde-stock.png" 
                  alt="Perfil Ativo" 
                  fill 
                  className={`object-contain transition-opacity absolute ${isPerfilAtivo ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} 
                />
              </Link>

              <button onClick={() => setEstaLogado(false)} className="relative w-[38px] h-[38px] group cursor-pointer">
                <Image 
                  src="/Navbar/fluent_arrow-exit-28-filled.png" 
                  alt="Sair" 
                  fill 
                  className="object-contain group-hover:opacity-0 transition-opacity absolute" 
                />
                <Image 
                  src="/Navbar/fluent_arrow-exit-28-filled-red-stock.png" 
                  alt="Sair Hover" 
                  fill 
                  className="object-contain opacity-0 group-hover:opacity-100 transition-opacity absolute" 
                />
              </button>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}