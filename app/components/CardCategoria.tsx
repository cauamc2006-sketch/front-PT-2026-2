import Image from 'next/image';

interface CardCategoriaProps {
  icone: string;
  nome: string;
}

export default function CardCategoria({ icone, nome }: CardCategoriaProps) {
  return (
    <div className="flex flex-col items-center gap-3 cursor-pointer group">
      <div className="w-[100px] h-[100px] bg-white rounded-[32px] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
        <Image src={icone} alt={nome} width={40} height={40} />
      </div>
      <span className="text-gray-800 font-medium text-sm">{nome}</span>
    </div>
  );
}