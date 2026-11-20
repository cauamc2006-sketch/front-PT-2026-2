export interface CategoriaInfo {
  nome: string;
  slug: string;
  imagem: string;
  icone: string;
  fraseBanner: string;
  subcategoriasPadrao?: string[];
}

export const CATEGORIAS: CategoriaInfo[] = [
  {
    nome: "Mercado",
    slug: "mercado",
    imagem: "/Feed/categoriaMercado.png",
    icone: "/lojas/mercado.svg",
    fraseBanner: "O essencial para o seu dia a dia,\ncom praticidade e economia",
    subcategoriasPadrao: ["Alimentos", "Bebidas", "Doces", "Salgados", "Limpeza", "Outros"],
  },
  {
    nome: "Farmácia",
    slug: "farmacia",
    imagem: "/Feed/categoriaFarmacia.png",
    icone: "/lojas/farmacia.svg",
    fraseBanner: "Saúde, bem-estar e cuidados,\nsempre ao seu alcance",
    subcategoriasPadrao: ["Medicamentos", "Vitaminas", "Higiene", "Cuidados", "Outros"],
  },
  {
    nome: "Beleza",
    slug: "beleza",
    imagem: "/Feed/categoriaBeleza.png",
    icone: "/lojas/beleza.svg",
    fraseBanner: "Realce o que há de melhor em você,\nem cada detalhe",
    subcategoriasPadrao: ["Maquiagem", "Skincare", "Cabelos", "Perfumes", "Outros"],
  },
  {
    nome: "Moda",
    slug: "moda",
    imagem: "/Feed/categoriaModa.png",
    icone: "/lojas/moda.svg",
    fraseBanner: "Seu estilo, suas escolhas,\ndo seu jeito",
    subcategoriasPadrao: ["Roupas", "Calçados", "Acessórios", "Bolsas", "Outros"],
  },
  {
    nome: "Eletrônicos",
    slug: "eletronicos",
    imagem: "/Feed/categoriaEletronicos.png",
    icone: "/lojas/eletronicos.svg",
    fraseBanner: "O universo da tecnologia\nem um só lugar",
    subcategoriasPadrao: ["Celulares", "Notebooks", "TVs", "Acessórios", "Outros"],
  },
  {
    nome: "Jogos",
    slug: "jogos",
    imagem: "/Feed/categoriaJogos.png",
    icone: "/lojas/jogos.svg",
    fraseBanner: "Jogabilidade e diversão,\nem um nível superior",
    subcategoriasPadrao: ["Consoles", "Jogos", "Controles", "Headsets", "Acessórios", "Outros"],
  },
  {
    nome: "Brinquedos",
    slug: "brinquedos",
    imagem: "/Feed/categoriaBrinquedos.png",
    icone: "/lojas/brinquedos.svg",
    fraseBanner: "A imaginação ganha vida,\npara todas as idades",
    subcategoriasPadrao: ["Educativos", "Bonecos", "Jogos de Tabuleiro", "Blocos", "Outros"],
  },
  {
    nome: "Casa",
    slug: "casa",
    imagem: "/Feed/categoriaCasa.png",
    icone: "/lojas/casa.svg",
    fraseBanner: "Conforto e praticidade,\npara o seu melhor cantinho",
    subcategoriasPadrao: ["Decoração", "Cozinha", "Cama e Banho", "Organização", "Outros"],
  },
];

export function getCategoriaPorSlug(slug: string): CategoriaInfo | undefined {
  const normalizado = slug.toLowerCase().trim();
  return CATEGORIAS.find(
    (c) => c.slug === normalizado || c.nome.toLowerCase() === normalizado
  );
}
