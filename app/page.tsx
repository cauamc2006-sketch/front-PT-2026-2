import Image from 'next/image';
import Link from 'next/link';
import CardProduto from './components/CardProduto';
import CardCategoria from './components/CardCategoria';

export default function Feed() {
  return (
    <div className="min-h-screen bg-[#F6F3E4]">
      <div className="bg-black text-white min-h-[200px] px-10 py-16 flex justify-between items-center relative overflow-hidden">
        <div className="max-w-2xl z-10">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Do CAOS à organização,<br />em alguns cliques
          </h1>
        </div>

        <div className="absolute right-0 bottom-0 w-[52%] h-full">
           <Image src="/Feed/Entregadora.svg" alt="Mascote" fill className="object-contain" priority />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex justify-center -mt-16 mb-12 relative z-20">
          <div className="bg-white rounded-full flex items-center w-full max-w-3xl px-6 py-3 shadow-lg">
            <input 
              type="text" 
              placeholder="Procurar por..." 
              className="flex-grow outline-none text-gray-600 placeholder-purple-300"
            />
            <button className="text-purple-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Categoria</h2>
          <div className="flex gap-6 overflow-x-auto pb-4">
            <CardCategoria icone="/Feed/Group 36.png" nome="Mercado" />
            <CardCategoria icone="/Feed/Group 38.png" nome="Farmácia" />
            <CardCategoria icone="/Feed/Group 33.png" nome="Beleza" />
            <CardCategoria icone="/Feed/Group 35.png" nome="Moda" />
            <CardCategoria icone="/Feed/Group 39.png" nome="Eletrônicos" />
            <CardCategoria icone="/Feed/Group 37.png" nome="Jogos" />
            <CardCategoria icone="/Feed/Group 40.png" nome="Brinquedos" />
            <CardCategoria icone="/Feed/Group 41.png" nome="Casa" />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Produtos <span className="text-sm font-normal text-purple-600">em Mercado</span>
            </h2>
            <Link href="/produtos" className="text-purple-600 text-sm hover:underline">
              ver mais
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {/* colocar os dados do backend aqui depois */}
            <CardProduto imagemUrl="/Logo.png" nome="Brownie Meio A." preco="R$ 4,70" lojaLogo="/Logo.png" />
            <CardProduto imagemUrl="/Logo.png" nome="Brownie Trad." preco="R$ 3,80" lojaLogo="/Logo.png" />
            <CardProduto imagemUrl="/Logo.png" nome="Nozes" preco="R$ 29,99" lojaLogo="/Logo.png" />
            <CardProduto imagemUrl="/Logo.png" nome="Banana" preco="R$ 3,99" lojaLogo="/Logo.png" />
            <CardProduto imagemUrl="/Logo.png" nome="Limão Siciliano" preco="R$ 17,99" lojaLogo="/Logo.png" />
          </div>
        </div>
      </div>
    </div>
  );
}