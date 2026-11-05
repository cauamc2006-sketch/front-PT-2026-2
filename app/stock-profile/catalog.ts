import type { Product } from "./types";

type Item = [name: string, price: number, available: boolean];

/** Referências fornecidas pelo usuário. Não representa estoque/preços da API. */
function sheetProducts(sheet: string, prefix: string, items: Item[]): Product[] {
  const columns = [0, 245, 491, 737, 982];
  return items.map(([name, price, available], index) => ({
    id: `${prefix}-${index}`, name, price, available,
    imageUrl: `/stock-profile/${sheet}`,
    imageRegion: { x: columns[index % 5], y: Math.floor(index / 5) * 327, width: 230, height: 184, sourceWidth: 1212, sourceHeight: 1035 },
  }));
}

const beauty = sheetProducts("catalogo-beleza.png", "beauty", [
  ["Lápis Labial", 139.90, true], ["Lip Tint", 8549.99, false], ["Contorno", 289.90, true], ["Iluminador", 249.90, true], ["Primer", 139, true],
  ["Máscara de Cílios", 109.99, true], ["Mini Blush", 99.99, false], ["Pó Compacto", 119.50, true], ["Perfume Rare", 599.90, true], ["Contorno", 289.99, false],
  ["Bronzer", 254.99, true], ["Bruma Facial", 149, false], ["Batom", 179, true], ["Blush", 199.99, false], ["Gel Perfumado", 179.99, true],
]);

export const beautyProducts: Product[] = [10, 13, 8, 3, 6, 0, 1, 2, 4, 5, 7, 9, 11, 12, 14].map(index => ({ ...beauty[index], storeName: "Rare Beauty", storeLogoUrl: "/stock-profile/rare-beauty-logo.svg" }));

export const electronicsProducts: Product[] = [
  ...sheetProducts("catalogo-eletronicos-1.png", "electronics-a", [
    ["Comp. Lenovo", 3899.99, true], ["Comp. Samsung", 8549.99, false], ["iPhone 15", 4769.10, true], ["Smart TV Philips", 1229, true], ["Xbox Series X", 3599.99, true],
    ["MacBook Air", 15899.99, true], ["iPhone 16", 4598.99, false], ["S25 Ultra", 5769.10, true], ["iPad", 7859, true], ["Headset Gamer", 899.99, false],
    ["Fones sem fio", 649.99, false], ["Nintendo S. 2", 4799.99, false], ["Smartwatch", 4089.10, true], ["JBL", 1399, true], ["Xbox Series S", 1499.99, true],
  ]),
  ...sheetProducts("catalogo-eletronicos-2.png", "electronics-b", [
    ["Cabo USB", 16.90, true], ["Micro SD", 179.90, true], ["iPhone 4", 469.99, true], ["PlayStation 5", 4992.98, true], ["Galaxy Z Fold", 13999.99, true],
    ["Nintendo 3DS", 2089.99, false], ["Galaxy A06", 588, false], ["Monitor", 988, true], ["Teclado e mouse", 165, true], ["Mouse", 81, false],
    ["Smart TV Neo", 4999, false], ["Soundbar", 1044.05, false], ["Vitrola", 559.99, true], ["Monitor", 1199, true], ["Smart TV", 1699.99, true],
  ]),
];
