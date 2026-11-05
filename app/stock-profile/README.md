# Entrega de front-end do Lucas — Perfil e cards

## Estrutura e escopo

A estrutura original foi mantida: `app/perfil` para as rotas, `app/stock-profile` para os componentes e `public/stock-profile` para os assets. Os arquivos da navbar, feed e cards do Moretti não foram alterados.

O perfil possui agora uma variante própria de cabeçalho em `ProfileNavbar.tsx`. Isso permite mostrar o estado de usuário conectado da referência sem depender da localização dos arquivos do Moretti. O grupo pode integrar essa variante à navbar compartilhada posteriormente.

## Visual conforme a referência fornecida

- Cabeçalho preto, logo STOCK.IO, ícones de produtos, lojas, perfil ativo e sair.
- Foto circular da referência, nome, username, e-mail e botão Editar Perfil.
- Fundo creme, seção Produtos e cards com fotos, nome, preço e logo Rare Beauty.
- Proporções ajustadas para a referência desktop e regras responsivas para tablet/celular.
- Modais de editar perfil, alterar senha e confirmar exclusão; ícones próprios sem dependências extras.
- A faixa de demonstração e os seletores de categoria foram retirados da área visual. `/perfil/previa` continua sendo uma prévia, identificada no título da aba e em nota acessível.

Os PNGs originais enviados não foram alterados. Fotos dos produtos são exibidas com regiões em SVG; texto e preço são elementos reais e acessíveis. A foto e o logo fornecidos são enquadrados em SVGs com a imagem original incorporada. O selo Rare Beauty é uma representação vetorial para os cards de demonstração.

## Rotas

- `/perfil/previa`: apresentação visual, funciona sem servidor. Dados de referência, edição e prévia de foto apenas em memória. Recarregar restaura os exemplos. Não altera senhas nem exclui contas reais.
- `/perfil`: usuário real autenticado. Usa o token salvo pelo login existente e `NEXT_PUBLIC_API_URL` (padrão `http://localhost:3001`).

## Funcionalidades reais conectadas

Contrato conferido no back-end do grupo, branch `dev`, com controladores e DTOs existentes:

| Ação | Contrato |
| --- | --- |
| Carregar perfil | `GET /user/:id` com Bearer token |
| Editar nome, username e e-mail | `PATCH /user/:id` com `name`, `username`, `email` |
| Confirmar senha antiga | `POST /auth/login`, conferindo o mesmo `userId` |
| Alterar senha | Após confirmação, `PATCH /user/:id` com `senha` |
| Excluir conta | Confirmação digitada `EXCLUIR`, depois `DELETE /user/:id` |
| Sair | Remove o token e redireciona para `/login` |

O `sub` do JWT só seleciona o registro: a autorização deve ser validada no servidor. Há carregamento, erros, sessão expirada, nova tentativa, validações, prevenção de envio duplicado, retorno e contenção do foco, e Escape. Senhas não são gravadas em localStorage nem em logs.

## Dependências externas que continuam fora desta entrega de front-end

O servidor atual **não tem upload/edição de foto** nem consulta implementada dos produtos pertencentes ao usuário. Por isso:

- A foto real existente é exibida; se não houver, aparecem iniciais. Envio de foto fica desabilitado no perfil real, com explicação. A seleção/prévia existe no componente e funciona na prévia; é ativável por `avatarEditing` quando o back-end suportar persistência.
- Produtos do perfil real não são substituídos por estoque fictício. A seção informa a indisponibilidade até haver a consulta.
- O cabeçalho navega para os produtos pela página inicial. O ícone de lojas fica desabilitado enquanto não há rota de lojas implementada; `storesHref` permite conectar a rota real depois, sem mudar o componente.
- A confirmação da senha antiga usa o login existente. Uma rota dedicada que faça essa verificação diretamente no servidor continua sendo responsabilidade do back-end.

Isso não pode ser resolvido apenas copiando arquivos de front-end; não foi criado um servidor paralelo nem alterado o back-end do grupo.

## Reutilizar os cards

```tsx
import { ProductCard, ProductImage, ProductGallery } from "@/app/stock-profile/ProductCard";

<ProductCard product={{
  id: "p1",
  name: "Blush",
  price: 199.99,
  imageUrl: "/imagem-do-produto.png",
  storeLogoUrl: "/logo-da-loja.svg",
  storeName: "Minha loja",
  available: true,
}} />
```

`available` é opcional; sem dados, nenhum estado de estoque é inventado. `href` é opcional e só deve receber uma rota real. `ProductImage` tem fallback; `ProductGallery` permite selecionar miniaturas. `imageRegion` permite usar as pranchas enviadas; para imagens individuais da API, não é necessário.

O catálogo de demonstração em `catalog.ts` não representa estoque real. Os preços e estados vêm da referência; rótulos visivelmente inconsistentes com as fotos foram normalizados na demonstração.

## Conferência

Testes cobrem edição/cancelamento, erros e validação de senha, exclusão confirmada, sessão, adapter de API, carregamento/erro/repetir, imagens/logos, expansão de cards, navegação de sair e visual sem overflow em celular. A integração de API é testada com respostas simuladas conforme o contrato; o teste com banco e conta reais do grupo precisa do servidor rodando.

O Next.js do projeto emitiu um alerta sobre a versão instalada. As dependências existentes foram preservadas, pois a atualização de framework está fora do escopo dos arquivos de perfil/cards.
