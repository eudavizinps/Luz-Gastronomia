# Publicação no Cloudflare Pages

Esta pasta já está pronta para ser publicada pelo GitHub no Cloudflare Pages. O site estático, a função `/api/discount` e a migração do banco D1 devem permanecer juntos nesta mesma pasta.

## 1. Criar o banco D1

No painel Cloudflare, abra **Workers & Pages > D1 SQL Database > Create database** e crie o banco com este nome:

`luz-gastronomia-discounts`

Copie o ID gerado e substitua `REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID` em `wrangler.toml`.

No terminal, estando nesta pasta e autenticado no Cloudflare, execute:

```powershell
npx wrangler d1 migrations apply luz-gastronomia-discounts --remote
```

Crie também o segredo que protege o identificador de CPF no banco:

```powershell
npx wrangler pages secret put CPF_HASH_SALT --project-name luz-gastronomia
```

Use uma frase longa, aleatória e exclusiva. Nunca publique esse valor no GitHub.

## 2. Conectar GitHub ao Cloudflare Pages

1. No Cloudflare, abra **Workers & Pages > Create application > Pages > Import an existing Git repository**.
2. Selecione o repositório `eudavizinps/Luz-Gastronomia` e a branch `main`.
3. Configure o **Root directory** como:

   `Sistema Luz Gastronomia/outputs/luz-gastronomia`

4. Use `exit 0` como **Build command** e `.` como **Build output directory**.
5. Publique o projeto com o nome `luz-gastronomia`.

## 3. Ligar o banco à página

Depois da primeira publicação, abra o projeto Pages em **Settings > Bindings > Add > D1 database**. Cadastre a variável `DISCOUNTS_DB`, selecione o banco `luz-gastronomia-discounts` e faça uma nova publicação.

## 4. Atualizações futuras

Cada atualização enviada para a branch `main` será publicada automaticamente pelo Cloudflare Pages. Para mudanças no banco, crie uma nova migração em `migrations/` e aplique-a no banco remoto antes da publicação.

## Observação sobre os descontos

O banco não armazena o CPF puro: a função cria uma assinatura criptográfica usando o segredo `CPF_HASH_SALT`. O desconto de 10% é reservado uma vez na primeira finalização e o de 5% uma vez na segunda, por CPF. Como o pagamento é combinado pelo WhatsApp, a reserva ocorre ao clicar em **Finalizar pedido**.
