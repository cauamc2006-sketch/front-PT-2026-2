"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { lojasApi, type Loja } from "@/lib/stockio-api";

function SecaoCategorias() {
  const categorias = [
    { nome: 'Mercado', img: '/Feed/categoriaMercado.png' },
    { nome: 'Farmácia', img: '/Feed/categoriaFarmacia.png' },
    { nome: 'Beleza', img: '/Feed/categoriaBeleza.png' },
    { nome: 'Moda', img: '/Feed/categoriaModa.png' },
    { nome: 'Eletrônicos', img: '/Feed/categoriaEletronicos.png' },
    { nome: 'Jogos', img: '/Feed/categoriaJogos.png' },
    { nome: 'Brinquedos', img: '/Feed/categoriaBrinquedos.png' },
    { nome: 'Casa', img: '/Feed/categoriaCasa.png' },
  ];

  return (
    <section className="bg-black pt-10 pb-12 pl-100"> 
      <h2 className="text-white text-3xl font-bold mb-8">Categoria</h2>
      
      <div className="flex gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {categorias.map((cat, index) => (
          <div 
            key={index} 
            className="flex-shrink-0 relative w-[120px] h-[120px] cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Image 
              src={cat.img} 
              alt={cat.nome} 
              fill
              className="object-contain"
            />
          </div>
        ))}
        
        <div className="flex-shrink-0 w-4"></div>
      </div>
    </section>
  );
}

function BlocoLojas() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const LOJAS_POR_PAGINA = 15;

  const categoriasFiltro = [
    { nome: 'Mercado', icone: '/lojas/mercado.svg' },
    { nome: 'Farmácia', icone: '/lojas/farmacia.svg' },
    { nome: 'Beleza', icone: '/lojas/beleza.svg' },
    { nome: 'Moda', icone: '/lojas/moda.svg' },
    { nome: 'Eletrônicos', icone: '/lojas/eletronicos.svg' },
    { nome: 'Jogos', icone: '/lojas/jogos.svg' },
    { nome: 'Brinquedos', icone: '/lojas/brinquedos.svg' },
    { nome: 'Casa', icone: '/lojas/casa.svg' },
  ];

  useEffect(() => {
    let ativo = true;

    lojasApi
      .listar()
      .then((data) => {
        if (ativo) {
          setLojas(data);
          setCarregando(false);
        }
      })
      .catch((e: unknown) => {
        if (ativo) {
          setErro(e instanceof Error ? e.message : "Não foi possível carregar as lojas.");
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  const lojasFiltradas = lojas.filter((loja) =>
    loja.nome.toLowerCase().includes(busca.trim().toLowerCase())
  );

  const totalPaginas = Math.max(1, Math.ceil(lojasFiltradas.length / LOJAS_POR_PAGINA));
  const indiceInicial = (paginaAtual - 1) * LOJAS_POR_PAGINA;
  const lojasExibidas = lojasFiltradas.slice(indiceInicial, indiceInicial + LOJAS_POR_PAGINA);

  function irParaPagina(novaPagina: number) {
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
      setPaginaAtual(novaPagina);
    }
  }

  return (
    <main className="bg-[#F6F3E4] min-h-screen px-16 py-16">
      <section className="space-y-6 items-start mb-16">

        <div className="ml-auto flex relative w-[700px]">
          <input 
            type="text" 
            placeholder="Procurar por..." 
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPaginaAtual(1);
            }}
            className="w-full rounded-full py-3 px-6 shadow-sm text-sm text-gray-500 bg-white outline-none border border-transparent focus:border-purple-300"
          />
          
          <div className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 flex-shrink-0 pointer-events-none">
            <Image 
              src="/lojas/lupa.svg" 
              alt="Buscar" 
              fill
              className="object-contain"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-[40px] font-medium text-black">Lojas</h2>
          
          <div className="relative font-light w-[467px]">
            <button 
              onClick={() => setFiltrosAbertos(true)}
              className="w-full flex justify-between items-center rounded-full py-3 px-6 shadow-sm bg-white text-lg text-[#6A38F3] outline-none"
            >
              <span>filtros</span>
              <span className="text-sm">v</span>
            </button>

            {filtrosAbertos && (
              <div className="absolute top-0 left-0 w-full bg-white rounded-[32px] p-6 shadow-xl z-50">
                <div 
                  className="flex justify-between items-center mb-6 cursor-pointer text-[#6A38F3]"
                  onClick={() => setFiltrosAbertos(false)}
                >
                  <span className="text-2xl font-light">filtros</span>
                  <span className="text-xl">^</span>
                </div>

                <div className="flex flex-col gap-4">
                  {categoriasFiltro.map((cat, index) => (
                    <label key={index} className="flex items-center gap-6 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="appearance-none w-6 h-6 border-[1.5px] border-[#6A38F3] rounded-[8px] checked:bg-[#6A38F3] cursor-pointer transition-colors flex-shrink-0"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-[#6A38F3] font-light text-lg">{cat.nome}</span>
                        <div className="relative w-5 h-5 flex-shrink-0">
                          <Image src={cat.icone} alt={`Ícone de ${cat.nome}`} fill className="object-contain" />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {carregando ? (
        <p role="status" className="text-center text-lg text-gray-600">Carregando lojas...</p>
      ) : erro ? (
        <div role="alert" className="text-center bg-white p-6 rounded-3xl max-w-md mx-auto shadow-sm">
          <p className="text-red-600 mb-2">{erro}</p>
        </div>
      ) : lojasFiltradas.length === 0 ? (
        <p className="text-center text-lg text-gray-500 my-12">Nenhuma loja encontrada.</p>
      ) : (
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-20 max-w-[1200px] mx-auto mb-20">
          {lojasExibidas.map((loja) => (
            <div key={loja.id} className="flex flex-col items-center cursor-pointer group">
              <div className="relative w-[135px] h-[135px] rounded-full overflow-hidden bg-white shadow-md mb-4 transition-transform group-hover:scale-105">
                <Image 
                  src={loja.logoUrl && loja.logoUrl.trim() ? loja.logoUrl : "/stock-profile/logo-reference.svg"} 
                  alt={loja.nome} 
                  fill 
                  className="object-cover" 
                  unoptimized
                />
              </div>
              <h3 className="text-xl font-medium text-black text-center">{loja.nome}</h3>
              <p className="text-sm text-[#6A38F3] text-center max-w-[180px] truncate">{loja.descricao || "Loja parceira"}</p>
            </div>
          ))}
        </section>
      )}

      {totalPaginas > 1 && (
        <section className="flex justify-center items-center gap-6 text-2xl font-light text-black">
          
          <button 
            onClick={() => irParaPagina(paginaAtual - 1)}
            disabled={paginaAtual === 1}
            className="hover:text-[#6A38F3] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            &lt;
          </button>
          
          {Array.from({ length: totalPaginas }).map((_, index) => {
            const numeroDaPagina = index + 1;
            return (
              <button 
                key={numeroDaPagina}
                onClick={() => irParaPagina(numeroDaPagina)}
                className={`hover:text-[#6A38F3] transition-colors ${paginaAtual === numeroDaPagina ? 'font-bold text-3xl' : ''}`}
              >
                {numeroDaPagina}
              </button>
            )
          })}
          
          <button 
            onClick={() => irParaPagina(paginaAtual + 1)}
            disabled={paginaAtual === totalPaginas}
            className="hover:text-[#6A38F3] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            &gt;
          </button>
          
        </section>
      )}

    </main>
  );
}

export default function LojasPage() {
  return (
    <>
      
      <SecaoCategorias />
      <BlocoLojas />
    </>
  )

}