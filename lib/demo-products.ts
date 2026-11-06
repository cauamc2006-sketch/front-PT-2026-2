import type { Product } from "@/lib/products";

/** Dados fictícios exclusivos para pré-visualização; não são retornados pela API. */
export const demoProducts: Product[] = [
  { id: -1, nome: "Caderno de anotações", descricao: "Produto fictício para testar o card e a listagem.", preco: "29.90", estoque: 12, ativo: true, imagens: [{ id: 1, urlImagem: "/demo/caderno.svg", ordem: 0 }, { id: 2, urlImagem: "/demo/caderno-detalhe.svg", ordem: 1 }] },
  { id: -2, nome: "Garrafa térmica", descricao: "Exemplo sem imagem para conferir o estado alternativo.", preco: 69.9, estoque: 0, ativo: true, imagens: [] },
  { id: -3, nome: "Mochila", descricao: "Produto fictício com preço e disponibilidade.", preco: 149, estoque: 4, ativo: true, imagens: [{ urlImagem: "/demo/mochila.svg", ordem: 0 }] },
];
