# Integração entre branches — STOCK.IO

## Base utilizada

Esta entrega foi montada sobre o ZIP da branch `dev` enviado pelo integrante. Não altera a `dev` remota nem faz merge automático de branches de outras pessoas.

## Auditoria das branches (GitHub)

- `feat/navbar` e `feat/perfil` contêm telas, imagens e componentes que **ainda não estão em `dev`**.
- `feat/perfil` já contém `app/components/CardProduto.tsx` e `app/stock-profile/ProductCard.tsx`, com `ProductImage` e `ProductGallery`.
- Portanto, **não copie outro ProductCard por cima dos existentes**. O componente `components/ProductImageCard.tsx` desta entrega pode ser reutilizado onde for necessário; o adaptador `toProfileCardProduct` em `lib/products.ts` converte dados do backend para o tipo esperado pelo card de `feat/perfil`.
- `feat/CRUD-produtos` expõe `/produto`, mas o service visto na auditoria ainda contém métodos de exemplo; a API real não foi validada.
- `feat/crud-lojas` e `feat/crud-comentario` têm serviços Prisma, mas não foram mescladas aqui porque não são dependências da tela de produtos.

## O que está pronto

1. Galeria reutilizável com miniaturas e fallback (`components/ProductImageCard.tsx`).
2. Página `/produtos`, com demonstração local sem backend e carregamento real opcional.
3. Cliente HTTP `GET /produto`, validação dos dados, tratamento de erros e autenticação opcional (`lib/products.ts`).
4. Adaptador `toProfileCardProduct` para a estrutura de cards da branch `feat/perfil`.

## Quando o CRUD de produtos estiver pronto

1. Definir `NEXT_PUBLIC_API_URL=http://localhost:3001` em `.env.local`.
2. Rodar backend e frontend (`npm run dev`) em seus diretórios.
3. Acessar `/produtos` e desligar o modo demonstração.
4. Verificar o retorno de `GET /produto`: deve ser um array de produtos com `id`, `nome`, `preco`, `estoque` e, opcionalmente, `imagens: [{urlImagem, ordem}]`.
5. Testar imagens, CORS, autenticação e resposta vazia.

## Cuidados para o PR

Abrir PR apenas com os arquivos da sua tarefa. Não substituir `app/layout.tsx`, `app/(main)/layout.tsx`, `app/components/Navbar.tsx` ou os arquivos de perfil dos colegas. Se a branch de perfil já tiver sido incorporada, usar `toProfileCardProduct` no card existente em vez de criar um terceiro card.

## Limitação

Não foi possível executar `next build` nesta sessão porque o ambiente não contém `node_modules` e não tem acesso à rede para instalar dependências. A integração de rede também depende do backend funcional.
