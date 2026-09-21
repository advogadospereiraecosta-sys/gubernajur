# Deploy — app.pereiraecostaadvogados.com.br

VPS Hostinger **147.79.81.96**, DNS no Registro.br, TLS pelo Caddy que já está
instalado na máquina.

> **A VPS não está vazia.** Ela já roda:
>
> | O quê | Onde |
> |---|---|
> | **fluxdchat** — stack `infra` (postgres, redis, api, web, caddy) | web em `127.0.0.1:3000`, api em `3001`, caddy nas portas 80 e 443 |
> | **Coolify** | 8000 |
> | **n8n** | 5678 |
>
> Por isso o gubernajur:
> - **não sobe Caddy próprio** — quem termina TLS é o caddy do fluxdchat;
> - **usa a porta 3010**, não a 3000, que está ocupada;
> - é exposto acrescentando um bloco ao Caddyfile do fluxdchat.
>
> O caddy do fluxdchat roda em `network_mode: host`, então alcança o loopback
> do host diretamente — `127.0.0.1:3010` funciona sem truque de rede.

## 1. DNS (Registro.br)

O domínio usa os nameservers do próprio Registro.br (`b.sec.dns.br`,
`c.sec.dns.br`), então o subdomínio se cria lá — **não na Vercel**, ainda que os
registros da raiz e do `www` apontem para ela.

Em **registro.br → Painel → pereiraecostaadvogados.com.br → Editar zona**,
acrescente:

```
app    A    147.79.81.96
```

Na interface do Registro.br o campo do nome recebe apenas `app` (sem o domínio),
o tipo é `A` e o valor é o IP.

Os registros existentes da raiz e do `www` continuam apontando para a Vercel,
onde está o site institucional. São independentes.

Propagação leva de minutos a algumas horas. Confira com:

```bash
nslookup app.pereiraecostaadvogados.com.br 8.8.8.8
```

Deve responder `147.79.81.96`.

Só siga para o passo 4 depois que responder com o IP da VPS — o Caddy precisa
disso para emitir o certificado.

## 2. Preparar a VPS

```bash
ssh root@147.79.81.96

# Docker e git já estão instalados; confirme antes de mexer
docker ps
```

As portas 22, 80 e 443 já estão abertas. **Não mexa no firewall** — o fluxdchat
está em produção nessa máquina e um `ufw enable` mal calibrado derruba os dois.

O compose de produção não publica as portas do Postgres nem do Redis, e a web
escuta apenas em loopback. Nada novo fica exposto à internet.

## 3. Código e segredos

```bash
git clone <URL-DO-REPOSITORIO> /opt/gubernajur
cd /opt/gubernajur

cp .env.production.example .env
nano .env
```

Gere cada segredo com `openssl rand -base64 32` — `DB_PASSWORD`,
`NEXTAUTH_SECRET`, `JWT_SECRET` e `AUTENTIQUE_WEBHOOK_SECRET`.

Sobre o último: enquanto ele estiver vazio, o webhook do Autentique aceita
qualquer POST sem verificação, porque a função de validação retorna `true`
quando não há segredo configurado. Preencha antes de expor o serviço.

## 4. Subir os containers

```bash
docker compose -f docker-compose.yml -f infra/docker-compose.prod.yml up -d --build
docker compose exec web npx prisma migrate deploy --schema=../../prisma/schema.prisma

# A web do gubernajur deve responder na 3010, ainda sem TLS.
# A 3000 é do fluxdchat — não confunda ao conferir.
curl -I http://127.0.0.1:3010
```

## 5. Ligar ao Caddy existente

Quem serve 80 e 443 é o caddy do **fluxdchat**. O Caddyfile dele fica em
`<raiz-do-fluxdchat>/infra/caddy/Caddyfile`, montado no container.

```bash
# Confirme o caminho no host
docker inspect infra-caddy-1 --format '{{json .Mounts}}' | tr ',' '
' | grep -i caddyfile

# Faça backup antes de editar algo que está em produção
cp <caminho>/Caddyfile <caminho>/Caddyfile.bak

# Acrescente o bloco de infra/Caddyfile.site AO FINAL,
# preservando o bloco {$DOMAIN} que serve o fluxdchat.com.br
nano <caminho>/Caddyfile
```

Valide e recarregue **sem reiniciar o container** — reload não derruba o
fluxdchat:

```bash
docker exec infra-caddy-1 caddy validate --config /etc/caddy/Caddyfile
docker exec infra-caddy-1 caddy reload   --config /etc/caddy/Caddyfile
```

Se o `validate` reclamar, o `reload` não roda e o fluxdchat segue no ar com a
configuração antiga. É por isso que os dois comandos vêm nessa ordem.

O certificado é emitido no primeiro acesso a
`https://app.pereiraecostaadvogados.com.br`.

## 6. Primeiro escritório

Acesse `https://app.pereiraecostaadvogados.com.br/registro` e crie o escritório
Pereira e Costa. O primeiro usuário vira ADMIN.

## 7. Conectar o Claude

Em **Integrações → Claude**, no painel, gere o token do escritório. Depois, nas
configurações de conectores do claude.ai, adicione o servidor MCP:

```
https://app.pereiraecostaadvogados.com.br/mcp
```

A partir daí o Claude enxerga as treze ferramentas — as sete de gestão que já
existiam e as seis do revisional.

**Escolha bem o domínio agora.** Essa URL fica registrada no conector; trocá-la
depois quebra a conexão e obriga a reconfigurar.

## 8. Backup

```bash
# Diário, 3h da manhã
echo '0 3 * * * cd /opt/gubernajur && docker compose exec -T db pg_dump -U gubernajur gubernajur | gzip > infra/backup/gubernajur-$(date +\%F).sql.gz && find infra/backup -name "*.sql.gz" -mtime +30 -delete' | crontab -
```

Backup que nunca foi restaurado não é backup. Teste a restauração uma vez por mês.

## Atualizar

```bash
cd /opt/gubernajur
git pull
docker compose -f docker-compose.yml -f infra/docker-compose.prod.yml up -d --build
docker compose exec web npx prisma migrate deploy --schema=../../prisma/schema.prisma
```

## Notas de arquitetura

**Por que VPS e não Vercel.** O gubernajur precisa de Postgres, Redis, o Next.js
e a API NestJS. A Vercel hospeda só o Next; o resto ficaria espalhado por outros
provedores — mais superfície operacional, não menos.

**Acoplamento a resolver depois.** O gubernajur passa a depender do caddy do
fluxdchat. Derrubar o stack do fluxdchat tira os dois do ar. Enquanto são dois
serviços, o custo é aceitável; num terceiro, vale extrair o caddy para um stack
próprio, com os aplicativos apenas publicando portas em loopback.

**Coolify está instalado e ocioso.** Os containers do Coolify rodam, mas o proxy
dele não — quem ocupa 80 e 443 é o caddy do fluxdchat. Se um dia quiserem parar
de gerenciar compose na mão, o Coolify já está lá para assumir domínio, TLS e
deploy por git push. Migrar exigiria tirar o caddy do fluxdchat do caminho.

**Schema do Prisma.** A fonte única é `prisma/schema.prisma` na raiz.
`apps/web/prisma/schema.prisma` é cópia gerada — o pnpm mantém stores separados
por workspace, e o client precisa ser gerado de dentro de `apps/web` para cair
no `node_modules` que aquele app resolve. A cópia é automática no `db:generate`
e no `build`. Não edite a cópia.
