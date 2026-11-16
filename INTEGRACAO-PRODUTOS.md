# Produtos — integração com API real

- `components/ProductImageCard.tsx`: galeria reutilizável com ordenação, miniaturas, seleção, acessibilidade e imagem alternativa.
- `app/components/CardProduto.tsx`: card de produto utilizado no Feed e perfil com imagem, preço e disponibilidade.
- `app/(main)/page.tsx` e `app/(main)/produtos/page.tsx`: telas de feed e listagem integradas diretamente ao backend.
- `lib/products.ts`: cliente HTTP para `GET /produto`, com validação e URL configurável por `NEXT_PUBLIC_API_URL` (padrão `http://localhost:3001`).
- Mocks e exemplos locais (`lib/demo-products.ts` e `public/demo/`) foram completamente removidos.

## Execução com Backend

1. Iniciar o backend NestJS (`PORT=3001`).
2. Confirmar que `GET /produto` devolve a lista real de produtos do banco de dados.
3. Iniciar o frontend (`npm run dev`).
4. Abrir `http://localhost:3000` (Feed) e `http://localhost:3000/produtos`.
5. Executar `npm run lint` e checagem de tipos (`tsc`).
