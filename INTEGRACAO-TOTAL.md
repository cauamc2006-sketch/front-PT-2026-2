# STOCK.IO - Integracao conjunta do frontend

Base `dev` + `feat/perfil` (que inclui `feat/navbar`) + complementos de produtos.
Login e cadastro ja estavam na ancestral `dev` da branch de perfil, segundo comparacao no GitHub.

Novos arquivos: pagina `/produtos`, componente de imagens e cliente HTTP `GET /produto`.
Para testes locais: `.env.local` com `NEXT_PUBLIC_API_URL=http://localhost:3001` e backend ativo. Nao publique credenciais.

IMPORTANTE: a pagina `/produtos` consome a API, mas outras telas podem conter dados demonstrativos e podem demandar ligacao adicional aos endpoints reais. O modo demonstracao de produtos e explicitamente identificado.

Nao mesclar em `dev` sem revisao, build e testes ponta a ponta.