import Image from "next/image";
import Link from "next/link";

interface CardCategoriaProps {
  icone: string;
  nome: string;
  slug?: string;
  href?: string;
}

export default function CardCategoria({ icone, nome, slug, href }: CardCategoriaProps) {
  const targetHref = href ?? (slug ? `/categoria/${slug}` : undefined);

  const cardContent = (
    <div className="flex flex-col items-center gap-3 cursor-pointer group">
      <div className="w-[100px] h-[100px] bg-white rounded-[32px] flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
        <Image src={icone} alt={nome} width={115} height={115} className="object-contain" />
      </div>
      <span className="text-gray-800 font-medium text-sm group-hover:text-[#6A38F3] transition-colors text-center">
        {nome}
      </span>
    </div>
  );

  if (targetHref) {
    return (
      <Link
        href={targetHref}
        className="outline-none focus-visible:ring-2 focus-visible:ring-[#6A38F3] rounded-[32px] transition-transform"
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}