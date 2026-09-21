# Estado do projeto — Produto "Revisional de Financiamento de Veículo"

> Documento de passagem de bastão. Escrito em **21/09/2026**, ao fim da sessão
> em que o produto foi construído. Serve para retomar de onde parou, sem
> reconstruir o raciocínio.

---

## 0. RISCO IMEDIATO — leia antes de tudo

**A pasta `gubernajur` NÃO é repositório git.** Sem `.git`, sem `.gitignore`,
sem remoto. São 175 arquivos-fonte, incluindo tudo que foi construído nesta
sessão, existindo **apenas no disco desta máquina**. Uma formatação, um comando
errado ou um HD com defeito apaga o trabalho inteiro.

Isso também bloqueia o `DEPLOY.md`, que manda `git clone <URL-DO-REPOSITORIO>` —
não existe URL.

Resolver antes de qualquer outra coisa:

```bash
cd ~/gubernajur

# .gitignore PRIMEIRO — sem ele, 188 MB de node_modules entram no commit
printf '%s\n' 'node_modules/' '.next/' 'dist/' '.env' '.env.local' '*.log' '.turbo/' 'apps/web/prisma/schema.prisma' > .gitignore

git init
git add .
git commit -m "Estado do projeto em 21/09/2026: produto revisional integrado"

# Depois crie o repositório remoto e envie
gh repo create advogadospereiraecosta-sys/gubernajur --private --source=. --push
```

A linha `apps/web/prisma/schema.prisma` no `.gitignore` é proposital: aquele
arquivo é **cópia gerada** da raiz (ver §7).

O `pereiraecosta-site-repo` está versionado e com remoto — o risco é só do
gubernajur.

---

## 1. O que é o projeto

Transformar a ação revisional de financiamento de veículo num **produto
jurídico repetível**: do primeiro contato ao protocolo da inicial, com cálculo
auditável, documentos gerados e assinados, e peça montada a partir de decisão
determinística.

A linha que organiza tudo:

> **Onde o resultado é determinístico, usa-se código. Onde depende dos fatos do
> caso, usa-se IA com revisão humana obrigatória.**

Cálculo, escolha do caminho processual, contrato, procuração e declaração são
código. Redação de peça é IA, sempre com verificação de citações e revisão.

---

## 2. Onde está cada coisa

### 2.1 `C:\Users\davi9\pereiraecosta-site-repo` — site institucional

Next.js na Vercel, banco no Supabase. Domínio **pereiraecostaadvogados.com.br**.

| Caminho | O que é | Estado |
|---|---|---|
| `lib/calculadoras-bancarias.ts` | Motor de cálculo: Tabela Price, revisão, contrato quitado, tarifas, taxa implícita por bissecção | pronto, 33 asserções |
| `lib/revisional/ficha.ts` | Modelo de dados do caso + `decidirCaminho()` (árvore de decisão) | pronto, 8 cenários |
| `lib/revisional/montar-inicial.ts` | Monta a peça ligando blocos conforme as teses | pronto |
| `app/calculadoras-bancarias/` | Landing pública com as 4 calculadoras | pronto |
| `docs/revisional/inicial-mestre.md` | Modelo mestre da inicial, 16 blocos condicionais | corrigido em 21/09 |
| `docs/revisional/ementario.md` | Teses vinculantes do STJ, verificadas na fonte | teses prontas; acórdãos pendentes |
| `lib/autentique.ts` | Cliente Autentique, agora com WhatsApp/SMS/link | modificado |
| `lib/supabase-middleware.ts` | `/calculadoras-bancarias` liberado | modificado |

**Branch:** `feat/calculadoras-bancarias` · **PR #2 aberto, não mergeado**
https://github.com/advogadospereiraecosta-sys/crm-imobiliario/pull/2

Os arquivos de `lib/revisional/`, `docs/revisional/` e a alteração em
`lib/autentique.ts` **não estão commitados** — ficaram no working tree.

### 2.2 `C:\Users\davi9\gubernajur` — SaaS jurídico

Next.js + NestJS + Postgres + Redis. É onde o produto passou a morar.

| Caminho | O que é |
|---|---|
| `prisma/schema.prisma` | +3 modelos (`ContratoBancario`, `EncargoContratual`, `AnaliseRevisional`), +4 enums, +3 campos em `Cliente` |
| `apps/web/src/lib/revisional/calculo.ts` | motor de cálculo portado |
| `apps/web/src/lib/revisional/decisao.ts` | árvore de decisão portada |
| `apps/web/src/lib/revisional/montar-inicial.ts` | montador da peça |
| `apps/web/src/lib/revisional/pdf-base.ts` | base de PDF, timbrado por inquilino |
| `apps/web/src/lib/revisional/gerar-documentos.ts` | contrato + procuração + declaração num PDF |
| `apps/web/src/lib/revisional/mcp-tools.ts` | **as 6 ferramentas MCP** |
| `apps/web/src/lib/revisional/inicial-mestre.md/.ts` | mestre + módulo gerado |
| `apps/web/src/lib/autentique.ts` | cliente Autentique + `consultarDocumento()` |
| `apps/web/src/app/mcp/route.ts` | servidor MCP; as 6 ferramentas foram acopladas |
| `apps/web/src/app/(dashboard)/revisional/` | módulo de carteira no painel |
| `apps/web/src/app/api/webhooks/autentique/route.ts` | webhook |
| `apps/web/src/components/Sidebar.tsx` | grupo "PRODUTOS" |
| `apps/web/src/middleware.ts` | +revisional, publicacoes, integracoes, notificacoes |
| `infra/docker-compose.prod.yml` | produção, porta 3010 |
| `infra/Caddyfile.site` | bloco para o Caddy do fluxdchat |
| `DEPLOY.md` | guia completo |
| `.env.production.example` | modelo de variáveis |
| `scripts/sync-mestre.js` | regenera o mestre em .ts |

**Build passando, typecheck limpo.** Nada commitado.

### 2.3 `C:\Users\davi9\fluxdchat` — CRM omnichannel

**Não foi modificado.** Apenas analisado, para decidir integração. 52 modelos
Prisma, 372 arquivos na API. É o que está em produção na VPS.

### 2.4 Google Drive

Pasta **"Revisonal de Financiamento de Veículos"**
https://drive.google.com/drive/folders/1zZMhGrL4QiQKZuLfYaTccF-s-evBsvTX

- `COMO OPERAR` — manual do produto (Google Doc)
- `_MODELOS/` — contrato modelo, parametros.json, preencher.py
- `_CONFIG/` — honorarios-padrao.json, FICHA DE ATENDIMENTO (planilha), série Bacen
- `Clientes/REV-2026-0001 Maria Luciana/` — 00-entrada, 01-ficha.json, 03-parecer

### 2.5 `C:\Users\davi9\Downloads\Contrato-Honorarios-MODELO\`

- `modelo-eletronico.docx` — **o modelo válido**, 27 parâmetros, sem testemunhas,
  com cláusula de assinatura eletrônica (MP 2.200-2/2001, art. 10, § 2º)
- `parametros.json`, `preencher.py`, `LEIA-ME.md`
- `REV-2026-0001-contrato.pdf` — exemplo gerado

---

## 3. Infraestrutura

### VPS — Hostinger `147.79.81.96`

Já ocupada. **Não está vazia.**

| O que roda | Onde |
|---|---|
| **fluxdchat** — stack `infra` (postgres, redis, api, web, caddy) | web `127.0.0.1:3000`, api `3001`, caddy nas portas 80/443 em `network_mode: host` |
| **Coolify** | 8000 — instalado e **ocioso**, proxy não roda |
| **n8n** | 5678 |

Consequências para o gubernajur, já refletidas nos arquivos:
- não sobe Caddy próprio (conflito de porta);
- usa **porta 3010**;
- é exposto acrescentando bloco ao Caddyfile do fluxdchat;
- o Caddy em `network_mode: host` **enxerga** `127.0.0.1` do host.

**Acoplamento criado:** derrubar o stack do fluxdchat derruba o gubernajur
junto, porque o Caddy é de lá. Com dois serviços é aceitável; num terceiro,
extrair o Caddy para stack próprio.

### DNS — Registro.br

Nameservers `b.sec.dns.br` e `c.sec.dns.br`. **Não é Vercel**, apesar de a raiz
apontar para lá.

| Registro | Valor | Estado |
|---|---|---|
| `app` A | 147.79.81.96 | **criado e propagado** |
| raiz | 216.198.79.1 (Vercel) | intocado |
| `www` | Vercel | intocado |

### Integrações

- **Autentique** — token em `.env.local` do site. WhatsApp validado em sandbox
  **e em produção**. Documento do REV-2026-0001 **assinado** em sandbox.
- **Bacen** — série 25471 (PF, aquisição de veículos), consultada ao vivo pela
  API oficial, sem chave.
- **MCP do gubernajur** — após deploy: `https://app.pereiraecostaadvogados.com.br/mcp`

---

## 4. O fluxo do produto

```
1 CAPTAÇÃO      /calculadoras-bancarias → WhatsApp
2 TRIAGEM       ficha → protocolo REV-AAAA-NNNN
3 ANÁLISE       extrai contrato → GATE 1 → Bacen → cálculo → decisão
4 CONTRATAÇÃO   contrato+procuração+declaração → Autentique → assinatura
5 PEÇA          mestre + blocos das teses → minuta
6 ACOMPANHA     réplica, apelação, contrarrazões
```

### As quatro travas

1. **Gate 1** — a prestação recalculada pela Price tem de reproduzir a do
   contrato. Divergiu, trava.
2. **Gate 2** — aceitar o caso é do advogado; o sistema entrega parecer.
3. **Gate 3** — nenhuma citação sem fonte conferida.
4. **Gate 4** — ninguém protocola o que não leu.

### As 6 ferramentas MCP

`criar_caso_revisional` · `analisar_contrato_revisional` ·
`consultar_caso_revisional` · `listar_casos_revisional` ·
`gerar_documentos_revisional` · `montar_inicial_revisional`

---

## 5. Caso piloto — REV-2026-0001

Maria Luciana Alves Conrado · CPF 036.998.094-80 · Banco PAN · 24/10/2023 ·
Honda Biz 110i 2023/2023.

| | |
|---|---|
| Valor financiado (campo **F.6**, com impostos) | R$ 10.869,20 |
| Prestação | R$ 449,47 (recalculada: R$ 449,43) |
| Taxa | 3,24% a.m. contra média Bacen de 1,96% → **1,653×** |
| CET | 4,56% a.m. / 72,02% a.a. |
| Parcelas | 34 de 48 |
| Benefício (só taxa) | R$ 4.057,88 |
| Benefício (com expurgo) | **R$ 5.794,59** |
| Honorários de êxito 30% | R$ 1.738,38 |

**Pendências do caso:** RG real (o usado é valor de teste `2782598`), quem
avaliou o veículo dado em troca (banco ou loja), número da CCB — o PDF em pasta
traz número de **orçamento** (103103109), não da cédula.

---

## 6. O que falta — em ordem de prioridade

### 6.1 CONCLUÍDO — modelo mestre corrigido

Feito em 21/09/2026. Seis correções aplicadas a partir das teses lidas na fonte
do STJ, replicadas no site repo, na cópia do gubernajur e no `inicial-mestre.ts`
regenerado. Detalhe de cada uma em `docs/revisional/ementario.md`, seção
"Registro de correções".

A correção da mora exigiu mudança também em `decidirCaminho()`: a tese agora só
liga quando há mora **e** a abusividade está nos juros remuneratórios. Antes
ligava em qualquer caminho B ou C, o que contrariava o Tema 972, item 3.

### 6.2 Fechar o que está pendente de commit

- **gubernajur: versionar (§0)** — o mais urgente de todos.
- **PR #2** do site está aberto, não mergeado.
- `lib/revisional/`, `docs/revisional/`, `docs/ESTADO-DO-PROJETO.md` e
  `lib/autentique.ts` do site: não commitados.

### 6.3 Deploy do gubernajur

Seguir `gubernajur/DEPLOY.md`. Resumo: clonar em `/opt/gubernajur`, preencher
`.env`, `docker compose -f docker-compose.yml -f infra/docker-compose.prod.yml
up -d --build`, `prisma migrate deploy`, acrescentar `infra/Caddyfile.site` ao
Caddyfile do fluxdchat, validar e recarregar.

A **migration ainda não existe** — nasce no primeiro `migrate deploy`.

### 6.4 Configurar o webhook

Registrar no painel do Autentique:
`https://app.pereiraecostaadvogados.com.br/api/webhooks/autentique`
e pôr o segredo em `AUTENTIQUE_WEBHOOK_SECRET`. **Sem o segredo o endpoint
recusa tudo, de propósito** (falha fechada).

### 6.5 Completar o ementário

- Reconferir na fonte as **súmulas** da Parte 2 (ainda não verificadas nesta rodada).
- Levantar **acórdãos** por tese, prioridade: tarifa de avaliação (serviço não
  prestado), seguro imposto, múltiplo de juros aceito pelo tribunal competente.
- `scon.stj.jus.br` está atrás de verificação anti-robô. Usar os portais dos TJs
  ou pedir que um humano faça a verificação.

### 6.6 Ponte com o fluxdchat (decidido, não iniciado)

Integração **opcional e por inquilino**, para os dois produtos seguirem
vendáveis separados. Desenho acordado:

- No fluxdchat: 3 endpoints em `public-api` com `ApiKeyAuthGuard` (já existe) —
  buscar contato, histórico de conversas, enviar mensagem.
- No gubernajur: 2 ferramentas MCP — `buscar_conversa_cliente`,
  `enviar_mensagem_cliente`.

**Não fundir os códigos.** Duas raízes de tenant (`Organization` × `Escritorio`),
dois modelos de usuário, duas autenticações, dois bancos vivos. Meses de
trabalho, risco de derrubar produção, e destrói o posicionamento de cada produto.

---

## 7. Descobertas que não devem se perder

**O cálculo que estava errado.** O PDF `revisao-financiamento-veiculo-2026-09-20.pdf`
(export do JurisBanc, na pasta de modelos) usou **R$ 16.600,00** como valor
financiado — que é o preço da moto, não o valor financiado. Resultado: prestação
de R$ 686,39, que não existe no contrato (R$ 449,47). Foi o que motivou o Gate 1.

**Os dois schemas Prisma do gubernajur.** Havia `prisma/schema.prisma` e
`apps/web/prisma/schema.prisma` divergentes. O do web estava sem `ClaudeConexao`,
`ApiKey` e o valor `CLAUDE` do enum — **a integração Claude não compilava**.
Causa: o pnpm mantém stores separados por workspace. Resolvido com fonte única na
raiz e cópia sincronizada no build. **Não editar a cópia.**

**O signatário fantasma do Autentique.** A lista `signatures` inclui o registro
do **proprietário** do documento, com `action: null`, que nunca assina. Contá-lo
como pendente faz todo documento parecer travado — cheguei a acusar falsamente
11 contratos travados por causa disso. Sempre filtrar por `action` definida.

**O webhook que aceitava tudo.** No site repo, `isValidSignature` faz
`return !secret` — ou seja, **sem segredo configurado, aceita qualquer POST**.
Verificar se `AUTENTIQUE_WEBHOOK_SECRET` existe na Vercel. O webhook novo do
gubernajur não repete isso: falha fechada e confirma o estado na API.

**Os modelos de petição eram antigos.** A jurisprudência estava em texto (não em
imagem, como cheguei a afirmar errado), mas era de **1996 e 1993** — anterior ao
REsp 1.061.530 (2008), à Súmula 530 (2015) e ao Tema 958 (2018).

**As três iniciais não eram alternativas de qualidade.** Eram três posturas
processuais diferentes. Daí os quatro caminhos (A/B/C/D) e os blocos condicionais.

**O canonical apontava para domínio morto.** Todas as landings citavam
`advogadospereiraecosta.com.br`, que não responde. O domínio vivo é
`pereiraecostaadvogados.com.br`. Há uma tarefa em segundo plano para corrigir as
páginas antigas; a nova já saiu certa.

---

## 8. Decisões tomadas, para não refazer o debate

| Decisão | Motivo |
|---|---|
| Não copiar o JurisBanc | produto de terceiro; fórmulas são livres, código e layout não |
| Modelo mestre com blocos condicionais, não três peças | as iniciais eram posturas, não versões |
| Assinatura eletrônica sem testemunhas | art. 24 do EAOAB dispensa; MP 2.200-2 exige aceitação expressa, que foi inserida |
| Êxito de 30% | padrão do escritório, já era o default do sistema |
| Drive antes da web | validar o produto jurídico antes de virar software |
| Depois: gubernajur, não Drive | resolve binário, webhook, carteira e multiusuário |
| VPS, não Vercel | precisa de Postgres + Redis + dois tiers |
| `app.pereiraecostaadvogados.com.br` | se o gubernajur for vendido, migrar para domínio próprio — a URL fica gravada no conector MCP |
| Integrar fluxdchat, não fundir | preserva os dois produtos vendáveis |
| Maritaca não serve de fonte | é LLM, não base de jurisprudência; bases oficiais dela são estatísticas |

---

## 9. Como retomar

1. Ler este arquivo e `docs/revisional/ementario.md`.
2. **Corrigir o modelo mestre** (§6.1) — é o que bloqueia o uso real.
3. Commitar o que está no working tree dos dois repositórios.
4. Deploy pelo `gubernajur/DEPLOY.md`.
5. Retomar o ementário e, depois, a ponte com o fluxdchat.
