import Image from 'next/image';

interface CardProdutoProps {
  imagemUrl: string;
  nome: string;
  preco: string;
  lojaLogo: string;
}

export default function CardProduto({ imagemUrl, nome, preco, lojaLogo }: CardProdutoProps) {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow relative w-full max-w-[220px]">
      <div className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
        <Image src={lojaLogo} alt="Logo da Loja" width={40} height={40} className="object-cover" />
      </div>
      
      <div className="relative h-40 w-full mb-3 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center">
        <Image src={imagemUrl} alt={nome} fill className="object-contain p-2" />
      </div>
      
      <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate">{nome}</h3>
      <div className="flex items-center gap-2">
        <span className="font-bold text-gray-900">{preco}</span>
        <span className="text-[10px] text-green-600 font-bold bg-green-100 px-1.5 py-0.5 rounded uppercase">Disponível</span>
      </div>
    </div>
  );
}