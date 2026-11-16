export interface CategoriaInfo {
  nome: string;
  imagem: string;
  icone: string;
}

export const CATEGORIAS: CategoriaInfo[] = [
  { nome: "Mercado", imagem: "/Feed/categoriaMercado.png", icone: "/lojas/mercado.svg" },
  { nome: "Farmácia", imagem: "/Feed/categoriaFarmacia.png", icone: "/lojas/farmacia.svg" },
  { nome: "Beleza", imagem: "/Feed/categoriaBeleza.png", icone: "/lojas/beleza.svg" },
  { nome: "Moda", imagem: "/Feed/categoriaModa.png", icone: "/lojas/moda.svg" },
  { nome: "Eletrônicos", imagem: "/Feed/categoriaEletronicos.png", icone: "/lojas/eletronicos.svg" },
  { nome: "Jogos", imagem: "/Feed/categoriaJogos.png", icone: "/lojas/jogos.svg" },
  { nome: "Brinquedos", imagem: "/Feed/categoriaBrinquedos.png", icone: "/lojas/brinquedos.svg" },
  { nome: "Casa", imagem: "/Feed/categoriaCasa.png", icone: "/lojas/casa.svg" },
];
