'use client'
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
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
          <Link href="/lojas" className="hover:opacity-70 transition-opacity">
            <Image 
              src="/Navbar/lsicon_store-filled.png" 
              alt="Lojas" 
              width={38} 
              height={38} 
            />
          </Link>
          <Link href="/carrinho" className="hover:opacity-70 transition-opacity">
            <Image 
              src="/Navbar/ion_bag-sharp.png" 
              alt="Carrinho" 
              width={38} 
              height={38} 
            />
          </Link>
        </div>

        {/* botoes de acao */}
        <div className="flex items-center gap-6 pl-6 border-l border-gray-600">
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
        </div>

      </div>
    </nav>
  );
}