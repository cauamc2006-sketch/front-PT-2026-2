'use client'
import Link from 'next/link';
import Image from 'next/image';
import React, { Suspense, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession, readSession, subscribeSession } from '@/lib/session';

function getSessionSnapshot() {
  return readSession() !== null;
}

function getServerSessionSnapshot() {
  return false;
}

function NavbarContent() {
  const pathname = usePathname();
  const router = useRouter();
  
  const estaLogado = useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSessionSnapshot);

  function handleLogout() {
    clearSession();
    router.replace('/login');
  }

  if (pathname === '/login' || pathname === '/cadastro') {
    return null;
  }

  const isLojasAtivo = pathname.startsWith('/lojas');
  const isCarrinhoAtivo = pathname.startsWith('/carrinho');
  const isPerfilAtivo = pathname.startsWith('/perfil');

  return (
    <nav className="bg-[#000000] w-full px-3 sm:px-8 py-4 sm:py-5 flex items-center justify-between gap-3 shadow-md">
      <Link href="/" className="shrink-0">
        <Image 
          src="/logo-branca.png" 
          alt="STOCK.IO" 
          width={221} 
          height={43} 
          priority
          className="h-auto w-[118px] cursor-pointer transition-opacity hover:opacity-90 sm:w-[221px]"
        />
      </Link>

      <div className="flex min-w-0 items-center gap-2 sm:gap-8">
        
        <div className="flex items-center gap-2 sm:gap-5">
          <Link href="/lojas" className="group relative h-7 w-7 sm:h-[38px] sm:w-[38px]">
            <Image 
              src="/Navbar/lsicon_store-filled.png" 
              alt="Lojas" 
              fill 
              sizes="(min-width: 640px) 38px, 28px"
              className={`object-contain transition-opacity absolute ${isLojasAtivo ? 'opacity-0' : 'group-hover:opacity-0'}`} 
            />
            <Image 
              src="/Navbar/lsicon_store-filled-verde-stock.png" 
              alt="Lojas Ativo" 
              fill 
              sizes="(min-width: 640px) 38px, 28px"
              className={`object-contain transition-opacity absolute ${isLojasAtivo ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} 
            />
          </Link>
          
          <Link href="/carrinho" className="group relative h-7 w-7 sm:h-[38px] sm:w-[38px]">
            <Image 
              src="/Navbar/ion_bag-sharp.png" 
              alt="Carrinho" 
              fill 
              sizes="(min-width: 640px) 38px, 28px"
              className={`object-contain transition-opacity absolute ${isCarrinhoAtivo ? 'opacity-0' : 'group-hover:opacity-0'}`} 
            />
            <Image 
              src="/Navbar/ion_bag-sharp-verde-stock.png" 
              alt="Carrinho Ativo" 
              fill 
              sizes="(min-width: 640px) 38px, 28px"
              className={`object-contain transition-opacity absolute ${isCarrinhoAtivo ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} 
            />
          </Link>
        </div>

        <div className="flex items-center gap-2 border-l border-gray-600 pl-2 sm:gap-6 sm:pl-6">
          {!estaLogado ? (
            <>
              <Link 
                href="/login" 
                className="text-[11px] font-bold uppercase tracking-wide text-[#6A38F3] transition-colors hover:text-purple-400 sm:text-lg"
              >
                Login
              </Link>
              <Link 
                href="/cadastro" 
                className="rounded-full bg-[#6A38F3] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg transition-colors hover:bg-[#5b2fd1] sm:px-8 sm:py-2.5 sm:text-lg"
              >
                Cadastre-se
              </Link>
            </>
          ) : (
            <>
              <Link href="/perfil" className="group relative h-7 w-7 sm:h-[38px] sm:w-[38px]">
                <Image 
                  src="/Navbar/ion_person.png" 
                  alt="Perfil" 
                  fill 
                  sizes="(min-width: 640px) 38px, 28px"
                  className={`object-contain transition-opacity absolute ${isPerfilAtivo ? 'opacity-0' : 'group-hover:opacity-0'}`} 
                />
                <Image 
                  src="/Navbar/ion_person-verde-stock.png" 
                  alt="Perfil Ativo" 
                  fill 
                  sizes="(min-width: 640px) 38px, 28px"
                  className={`object-contain transition-opacity absolute ${isPerfilAtivo ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} 
                />
              </Link>

              <button onClick={handleLogout} aria-label="Sair da conta" title="Sair da conta" className="group relative h-7 w-7 cursor-pointer sm:h-[38px] sm:w-[38px]">
                <Image 
                  src="/Navbar/fluent_arrow-exit-28-filled.png" 
                  alt="Sair" 
                  fill 
                  sizes="(min-width: 640px) 38px, 28px"
                  className="object-contain group-hover:opacity-0 transition-opacity absolute" 
                />
                <Image 
                  src="/Navbar/fluent_arrow-exit-28-filled-red-stock.png" 
                  alt="Sair Hover" 
                  fill 
                  sizes="(min-width: 640px) 38px, 28px"
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

function NavbarFallback() {
  return (
    <nav className="flex h-[67px] w-full items-center justify-between bg-[#000000] px-3 py-4 shadow-md sm:h-[83px] sm:px-8 sm:py-5">
      <Link href="/">
        <Image 
          src="/logo-branca.png" 
          alt="STOCK.IO" 
          width={221} 
          height={43} 
          priority
          className="h-auto w-[118px] cursor-pointer transition-opacity hover:opacity-90 sm:w-[221px]"
        />
      </Link>
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<NavbarFallback />}>
      <NavbarContent />
    </Suspense>
  );
}
