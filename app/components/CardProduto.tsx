import Image from 'next/image';

interface CardProdutoProps {
  imagemUrl?: string | null;
  nome: string;
  preco: string;
  lojaLogo?: string | null;
  disponivel?: boolean;
  statusLayout?: 'inline' | 'stack';
}

export default function CardProduto({
  imagemUrl,
  nome,
  preco,
  lojaLogo,
  disponivel = true,
  statusLayout = 'inline',
}: CardProdutoProps) {
  const safeLojaLogo = lojaLogo && lojaLogo.trim() ? lojaLogo : '/Logo.png';
  const safeImagemUrl = imagemUrl && imagemUrl.trim() ? imagemUrl : '/Logo.png';

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow relative w-full max-w-[220px]">
      <div className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-white">
        <Image
          src={safeLojaLogo}
          alt="Logo da Loja"
          width={40}
          height={40}
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="relative h-40 w-full mb-3 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center">
        <Image
          src={safeImagemUrl}
          alt={nome}
          fill
          className="object-contain p-2"
          unoptimized
        />
      </div>

      <h3 className="font-semibold text-gray-800 text-[20px] mb-1 truncate" title={nome}>
        {nome}
      </h3>
      <div className={statusLayout === 'stack' ? 'flex flex-col items-start gap-0.5' : 'flex items-center gap-2'}>
        <span className="font-bold text-gray-900">{preco}</span>
        {statusLayout === 'stack' ? (
          disponivel ? (
            <span className="text-[17px] text-green-600 font-semibold">
              Disponível
            </span>
          ) : (
            <span className="text-[17px] text-red-600 font-semibold">
              Indisponível
            </span>
          )
        ) : disponivel ? (
          <span className="text-[10px] text-green-600 font-bold bg-green-100 px-1.5 py-0.5 rounded uppercase">
            Disponível
          </span>
        ) : (
          <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-1.5 py-0.5 rounded uppercase">
            Sem estoque
          </span>
        )}
      </div>
    </div>
  );
}