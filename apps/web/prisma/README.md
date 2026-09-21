# Não edite `schema.prisma` aqui

Este arquivo é uma **cópia gerada** de `prisma/schema.prisma` na raiz do
monorepo, que é a fonte única da verdade.

A cópia existe porque o pnpm mantém stores separados por workspace: o
`prisma generate` precisa rodar com o schema dentro de `apps/web` para que o
client seja gerado no `node_modules` que este app resolve.

A sincronização é automática — `npm run db:generate` e `npm run build` copiam
antes de gerar. Para editar o modelo de dados, altere o schema da raiz.

Histórico: antes desta padronização havia dois schemas editados à mão, que
divergiram. O de `apps/web` ficou sem `ClaudeConexao`, `ApiKey` e o valor
`CLAUDE` do enum `TipoIntegracao`, o que quebrava a compilação de toda a
integração com o Claude.
