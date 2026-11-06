# Produtos — entrega parcial independente do CRUD

- `components/ProductImageCard.tsx`: galeria reutilizável com ordenação, miniaturas, seleção, acessibilidade e imagem alternativa.
- `app/produtos/page.tsx`: listagem responsiva, estados de carregamento/erro/vazio, atualização e **modo de demonstração explícito**.
- `lib/demo-products.ts` e `public/demo/`: exemplos locais. Não são dados reais e não são enviados ao backend.
- `lib/products.ts`: adaptador para `GET /produto`, com validação de resposta e URL configurável por `NEXT_PUBLIC_API_URL` (padrão `http://localhost:3001`).

## Testar sem backend

1. `npm ci`
2. `npm run dev`
3. Abrir `http://localhost:3000/produtos`.
4. Clicar **Visualizar exemplo sem backend**; testar troca de miniaturas, imagens ausentes e responsividade.

## Quando o CRUD estiver pronto

1. Iniciar o backend com banco configurado.
2. Confirmar que `GET /produto` devolve uma lista JSON de objetos `{ id, nome, preco, estoque, imagens?: [{ id?, urlImagem, ordem? }] }`.
3. Clicar **Voltar aos produtos reais** e conferir os dados reais. Se a API usar outra estrutura ou rota, ajustar apenas `lib/products.ts`.
4. Executar `npm run lint` e `npm run build` no ambiente de desenvolvimento.

**Limitação:** os exemplos não substituem a integração real nem demonstram CRUD funcional. Nenhum endpoint de escrita foi implementado no frontend.
