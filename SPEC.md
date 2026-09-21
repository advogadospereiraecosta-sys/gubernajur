# Gubernajur — Especificação Técnica

> **Versão:** 1.0.0
> **Data:** 2026-09-16
> **Status:** Proposta

---

## 1. Visão do Produto

**Gubernajur** é um SaaS multi-tenant de gestão para escritórios de advocacia, permitindo que advogados e suas equipes gerenciem processos, clientes, prazos, financeiro e demandas em um único ambiente integrado.

### Diferencial Competitivo
- 🇧🇷 100% Brasileiro — desenvolvido para o contexto jurídico nacional
- 🔒 Multi-tenant seguro — dados rigidamente isolados por escritório
- ⚡ Performático — otimizado para VPS com recursos limitados
- 🔗 Integrações nativas com TJs brasileiros
- 📱 Mobile-first — acessível de qualquer dispositivo

---

## 2. Stack Tecnológica

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI ou Shadcn/UI
- **State Management**: Zustand ou Jotai
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts ou Tremor
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js 20+
- **Framework**: NestJS (para escalabilidade) ou Fastify (para performance)
- **API**: RESTful + GraphQL opcional
- **ORM**: Prisma
- **Auth**: NextAuth.js ou JWT nativo
- **Validation**: Zod
- **Logging**: Pino

### Database
- **SGBD**: PostgreSQL 15+
- **Multi-tenancy**: Row-Level Security (RLS)
- **Cache**: Redis (para sessões e cache)
- **Migrations**: Prisma Migrate

### Infrastructure
- **Container**: Docker + Docker Compose
- **Proxy Reverso**: Nginx ou Caddy
- **CI/CD**: GitHub Actions
- **Hosting**: VPS própria (Coolify-ready)

---

## 3. Arquitetura Multi-tenant

### Estratégia: Row-Level Security (RLS)

Cada escritório é um **tenant** isolado. O isolamento ocorre no nível do banco de dados:

```sql
-- Exemplo de política RLS
CREATE POLICY tenant_isolation ON processos
  FOR ALL
  USING (escritorio_id = current_setting('app.current_tenant')::uuid);
```

### Schema do Banco

```prisma
// models/tenant.prisma

model Escritorio {
  id          String   @id @default(uuid())
  nome        String
  cnpj        String?  @unique
  logo        String?
  plano       Plano    @default(BASICO)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  usuarios    Usuario[]
  processos   Processo[]
  clientes    Cliente[]
  demandas    Demanda[]
  financeiro  Financeiro[]
  integracoes Integracao[]
  configuracoes Configuracao[]
}

model Usuario {
  id          String   @id @default(uuid())
  email       String   @unique
  senhaHash   String
  nome        String
  funcao      Funcao   @default(ADVOGADO)
  perfil      Perfil   @default(BASICO)
  ativo       Boolean  @default(true)
  escritorioId String
  escritorio  Escritorio @relation(fields: [escritorioId], references: [id])
  createdAt   DateTime @default(now())

  demandas    Demanda[]
  processos   Processo[]
}

enum Plano {
  BASICO
  PROFISSIONAL
  EMPRESARIAL
}

enum Funcao {
  ADMIN
  ADVOGADO
  ESTAGIARIO
  SECRETARIO
}

enum Perfil {
  ADMIN
  ADVOGADO
  BASICO
}
```

---

## 4. Modelagem de Dados

### 4.1 Processos

```prisma
model Processo {
  id              String   @id @default(uuid())
  numeroCNJ       String   @unique // 0000000-00.0000.0.00.0000
  clienteId       String
  cliente         Cliente  @relation(fields: [clienteId], references: [id])
  escritorioId    String
  escritorio      Escritorio @relation(fields: [escritorioId], references: [id])

  // Dados processuais
  orgaoJulgador   String
  tribunal        String
  instancia       Int      @default(1) // 1ª, 2ª instância
  classe          String
  area            AreaJuridica
  fase            FaseProcessual @default(DISTRIBUIDO)
  valorCausa      Decimal? @db.Decimal(15, 2)
  dataDistribuicao DateTime

  // Custos e honorários
  honorarios      Decimal? @db.Decimal(15, 2)
  custas          Decimal? @db.Decimal(15, 2)

  // Metadados
  segredoJustica  Boolean  @default(false)
  preferencia     String?  // urgente, prioritário, etc.

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  demandas        Demanda[]
  audiencias      Audiencia[]
  publicaciones   Publicacao[]
  prazos          Prazo[]
  documentos      Documento[]
}

enum AreaJuridica {
  CIVEL
  PENAL
  TRABALHISTA
  TRIBUTARIO
  PREVIDENCIARIO
  ELEITORAL
  MILITAR
  AMBIENTAL
  CONSUMIDOR
  IMOBILIARIO
  FAMILIA
  SUCESSOES
  COMERCIAL
  CONSTITUCIONAL
}

enum FaseProcessual {
  DISTRIBUIDO
  CADASTRADO
  CITAÇÃO
  AUDIENCIA_CITAÇÃO
  INSTRUÇÃO
  MEMORIAIS
  CONCLUSÃO
  SENTENÇA
  RECURSO
  EXECUÇÃO
  ARQUIVADO
}
```

### 4.2 Clientes

```prisma
model Cliente {
  id              String   @id @default(uuid())
  tipoPessoa      TipoPessoa
  nome            String   // Nome/Razão Social
  cpfCnpj        String?  @unique
  rgIe            String?

  // Contato
  email           String?
  telefone        String?
  celular         String?
  endereco        String?
  bairro          String?
  cidade          String?
  estado          String?  @db.VarChar(2)

  // Dados complementares
  profissao       String?  // Para PF
  naturezaJuridica String? // Para PJ

  // Metadados
  observacoes     String?  @db.Text
  escritorioId    String
  escritorio      Escritorio @relation(fields: [escritorioId], references: [id])

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  processos       Processo[]
  financeiro      Financeiro[]
  documentos      Documento[]

  @@index([escritorioId])
}

enum TipoPessoa {
  FISICA
  JURIDICA
}
```

### 4.3 Demandas (Tarefas/Kanban)

```prisma
model Demanda {
  id              String   @id @default(uuid())
  titulo          String
  descricao       String?  @db.Text

  // Relacionamentos
  processoId      String?
  processo        Processo? @relation(fields: [processoId], references: [id])
  escritorioId    String
  escritorio      Escritorio @relation(fields: [escritorioId], references: [id])
  responsavelId   String?
  responsavel     Usuario?  @relation(fields: [responsavelId], references: [id])

  // Status Kanban
  status          StatusDemanda @default(A_FAZER)
  coluna          String   @default("a_fazer") // Para看板personalizado

  // Dados temporais
  prazo           DateTime?
  duracaoEstimada Int?     // Em minutos
  prioridade      Prioridade @default(NORMAL)
  concluidaEm     DateTime?

  // Tags
  tags            String[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  comentarios     Comentario[]
  anexos          Anexo[]
}

enum StatusDemanda {
  A_FAZER
  EM_ANDAMENTO
  EM_REVISAO
  CONCLUIDO
  CANCELADO
}

enum Prioridade {
  BAIXA
  NORMAL
  ALTA
  URGENTE
}
```

### 4.4 Agenda

```prisma
model Audiencia {
  id              String   @id @default(uuid())
  processoId      String
  processo        Processo @relation(fields: [processoId], references: [id])

  // Dados da audiência
  tipo            TipoAudiencia
  dataHora        DateTime
  duracao         Int?     // Em minutos
  local           String?  // Endereço ou link
  tipoLocal       TipoLocal @default(PRESENCIAL)

  // Participantes
  pauta           String?
  observacoes     String?  @db.Text

  // Notificações
  lembreteEnviado Boolean  @default(false)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum TipoAudiencia {
  INSTRUÇÃO
  CONCILIAÇÃO
  JULGAMENTO
  SESSÃO
  OITIVA
  CUSTÓDIA
  UNA
  INQUÉRITO
  OUTRA
}

enum TipoLocal {
  PRESENCIAL
  VIDEOCONFERENCIA
  HÍBRIDO
}
```

### 4.5 Prazos

```prisma
model Prazo {
  id              String   @id @default(uuid())
  processoId      String
  processo        Processo @relation(fields: [processoId], references: [id])

  // Dados do prazo
  tipo            TipoPrazo
  descricao       String
  dataFinal       DateTime
  dataInicial     DateTime?

  // Status
  status          StatusPrazo @default(ATIVO)
  concluidoEm     DateTime?
  renovavel       Boolean  @default(false)

  // Lembretes
  lembretes       DateTime[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([dataFinal])
}

enum TipoPrazo {
  CONTESTAÇÃO
  RECURSO
  MANIFESTAÇÃO
  PRAZO_SEGURO
  PERÍCIA
  AUDIÊNCIA
  SESSÃO_JULGAMENTO
  PRAZO_LEGAL
  OUTRO
}

enum StatusPrazo {
  ATIVO
  VENCIDO
  CONCLUÍDO
  SUSPENSO
  CANCELADO
}
```

### 4.6 Financeiro

```prisma
model Financeiro {
  id              String   @id @default(uuid())
  escritorioId    String
  escritorio      Escritorio @relation(fields: [escritorioId], references: [id])
  clienteId       String?
  cliente         Cliente? @relation(fields: [clienteId], references: [id])
  processoId      String?

  // Dados do lançamento
  tipo            TipoLancamento
  categoria       CategoriaFinanceira
  descricao       String
  valor           Decimal  @db.Decimal(15, 2)

  // Datas
  dataVencimento  DateTime
  dataPagamento   DateTime?

  // Status
  status          StatusFinanceiro @default(PENDENTE)

  // Juros e multa
  juros           Decimal? @db.Decimal(15, 2)
  multa           Decimal? @db.Decimal(15, 2)

  // Forma de pagamento
  formaPagamento  FormaPagamento?
  observacoes     String?  @db.Text

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([escritorioId, dataVencimento])
}

enum TipoLancamento {
  RECEITA
  DESPESA
}

enum CategoriaFinanceira {
  // Receitas
  HONORARIOS
  CUSTAS
  SUCUMBÊNCIA
  HONORARIOS_SUCUMBENCIAIS
  OUTRA_RECEITA

  // Despesas
  SALÁRIO
  ENERGIA
  INTERNET
  ALUGUEL
  SOFTWARE
  CUSTAS_CARTORÁRIAS
  PERÍCIA
  DESPESA_JURÍDICA
  IMPOSTOS
  OUTRA_DESPESA
}

enum StatusFinanceiro {
  PENDENTE
  PAGO
  VENCIDO
  CANCELADO
  PARCELADO
}

enum FormaPagamento {
  DINHEIRO
  PIX
  TRANSFERÊNCIA
  BOLETO
  CARTÃO DÉBITO
  CARTÃO CRÉDITO
  DÉBITO_AUTOMÁTICO
}
```

### 4.7 Publicações

```prisma
model Publicacao {
  id              String   @id @default(uuid())
  processoId      String
  processo        Processo @relation(fields: [processoId], references: [id])

  // Dados da publicação
  tribunal        String
  tipo            String   // Despacho, Sentença, etc.
  conteudo        String   @db.Text
  dataPublicacao  DateTime
  paginaDiario    Int?

  // Status de triagem
  lida            Boolean  @default(false)
  triadaEm        DateTime?

  // Análise
  observacoes     String?  @db.Text

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([processoId, dataPublicacao])
}
```

### 4.8 Equipe

```prisma
// Já definido parcialmente em tenant.prisma
// Aqui complementamos com convites e permissões granulares

model Convite {
  id              String   @id @default(uuid())
  escritorioId    String
  email           String
  funcao          Funcao
  perfil          Perfil
  token           String   @unique
  expiresAt       DateTime
  usadoEm         DateTime?
  createdAt       DateTime @default(now())
}

model LogAtividade {
  id              String   @id @default(uuid())
  escritorioId    String
  usuarioId       String
  acao            String   // CREATE, UPDATE, DELETE
  modulo          String   // processo, cliente, demanda, etc.
  registroId      String
  dadosAnteriores Json?
  dadosNovos      Json?

  createdAt       DateTime @default(now())

  @@index([escritorioId, createdAt])
}
```

---

## 5. Estrutura de Pastas

```
gubernajur/
├── apps/
│   ├── web/                    # Frontend Next.js
│   │   ├── src/
│   │   │   ├── app/            # App Router
│   │   │   │   ├── (auth)/     # Rotas de autenticação
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── registro/
│   │   │   │   │   └── esqueci-senha/
│   │   │   │   ├── (dashboard)/ # Rotas protegidas
│   │   │   │   │   ├── painel/
│   │   │   │   │   ├── processos/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── novo/
│   │   │   │   │   ├── clientes/
│   │   │   │   │   ├── demandas/
│   │   │   │   │   ├── agenda/
│   │   │   │   │   ├── financeiro/
│   │   │   │   │   ├── equipe/
│   │   │   │   │   ├── integracoes/
│   │   │   │   │   ├── configuracoes/
│   │   │   │   │   ├── inbox/
│   │   │   │   │   └── ajuda/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/         # Componentes base
│   │   │   │   ├── forms/      # Formulários
│   │   │   │   ├── charts/     # Gráficos
│   │   │   │   ├── layout/     # Header, Sidebar, etc.
│   │   │   │   └── modules/    # Componentes por módulo
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── lib/            # Utilitários
│   │   │   │   ├── api.ts      # Cliente API
│   │   │   │   ├── auth.ts     # Auth helpers
│   │   │   │   └── utils.ts    # Funções úteis
│   │   │   ├── stores/         # Zustand stores
│   │   │   └── types/          # Tipos TypeScript
│   │   ├── public/
│   │   ├── prisma/             # Schema do banco
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── api/                    # Backend NestJS/Fastify
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── usuarios/
│       │   │   ├── processos/
│       │   │   ├── clientes/
│       │   │   ├── demandas/
│       │   │   ├── agenda/
│       │   │   ├── financeiro/
│       │   │   ├──-publicacoes/
│       │   │   ├── integracoes/
│       │   │   └── configuracoes/
│       │   ├── common/         # Guards, decorators, pipes
│       │   ├── database/       # Configuração do Prisma
│       │   └── config/         # Environment config
│       └── package.json
│
├── packages/
│   ├── ui/                    # Componentes compartilhados
│   ├── config/                # Configs compartilhadas
│   └── tsconfig/              # TypeScript base
│
├── infra/                     # Docker, nginx, etc.
│   ├── docker/
│   │   ├── Dockerfile.web
│   │   ├── Dockerfile.api
│   │   └── docker-compose.yml
│   └── nginx/
│       └── default.conf
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── SPEC.md
├── README.md
├── package.json
└── turbo.json
```

---

## 6. API Endpoints

### 6.1 Autenticação

```
POST   /api/auth/register     # Registro de novo escritório
POST   /api/auth/login        # Login
POST   /api/auth/logout       # Logout
POST   /api/auth/refresh      # Refresh token
POST   /api/auth/forgot       # Esqueci senha
POST   /api/auth/reset        # Reset senha
GET    /api/auth/me           # Usuário atual
```

### 6.2 Processos

```
GET    /api/processos              # Listar (com filtros)
POST   /api/processos              # Criar
GET    /api/processos/:id           # Detalhes
PUT    /api/processos/:id           # Atualizar
DELETE /api/processos/:id           # Deletar
GET    /api/processos/:id/demandas  # Demandas do processo
GET    /api/processos/:id/prazos    # Prazos do processo
GET    /api/processos/:id/audiencias # Audiências
GET    /api/processos/buscar-cnj   # Buscar no CNJ
```

### 6.3 Clientes

```
GET    /api/clientes                # Listar
POST   /api/clientes                # Criar
GET    /api/clientes/:id            # Detalhes
PUT    /api/clientes/:id            # Atualizar
DELETE /api/clientes/:id            # Deletar
GET    /api/clientes/:id/processos  # Processos do cliente
```

### 6.4 Demandas

```
GET    /api/demandas                 # Listar (filtros: status, responsavel)
POST   /api/demandas                 # Criar
GET    /api/demandas/:id             # Detalhes
PUT    /api/demandas/:id             # Atualizar
PATCH  /api/demandas/:id/status     # Mudar status
DELETE /api/demandas/:id            # Deletar
POST   /api/demandas/:id/comentarios # Adicionar comentário
```

### 6.5 Agenda

```
GET    /api/agenda                  # Listar eventos (por período)
POST   /api/agenda/audiencia        # Criar audiência
GET    /api/agenda/audiencia/:id    # Detalhes audiência
PUT    /api/agenda/audiencia/:id    # Atualizar
DELETE /api/agenda/audiencia/:id    # Deletar
GET    /api/agenda/prazos           # Listar prazos
POST   /api/agenda/prazo           # Criar prazo
```

### 6.6 Financeiro

```
GET    /api/financeiro              # Listar lançamentos
POST   /api/financeiro              # Criar lançamento
GET    /api/financeiro/:id           # Detalhes
PUT    /api/financeiro/:id           # Atualizar
PATCH  /api/financeiro/:id/baixa    # Dar baixa
DELETE /api/financeiro/:id          # Cancelar
GET    /api/financeiro/dashboard    # Dashboard financeiro
GET    /api/financeiro/relatorio    # Relatórios
```

### 6.7 Equipe

```
GET    /api/equipe                  # Listar membros
POST   /api/equipe/invite           # Convidar membro
PUT    /api/equipe/:id              # Atualizar membro
DELETE /api/equipe/:id              # Remover membro
GET    /api/equipe/convites         # Listar convites pendentes
DELETE /api/equipe/convites/:id     # Cancelar convite
```

### 6.8 Integrações

```
GET    /api/integracoes             # Listar integrações
POST   /api/integracoes             # Criar/configurar integração
GET    /api/integracoes/:id         # Status da integração
DELETE /api/integracoes/:id         # Remover integração
POST   /api/integracoes/:id/sync    # Forçar sincronização
GET    /api/integracoes/tribunais   # Listar tribunais disponíveis
```

---

## 7. Módulos e Funcionalidades

### Módulo 1: Autenticação
- [ ] Login com e-mail/senha
- [ ] Registro de novo escritório
- [ ] Recuperação de senha
- [ ] Logout global
- [ ] Sessão persistente
- [ ] Multi-escritório (switch)

### Módulo 2: Painel (Dashboard)
- [ ] KPIs principais
- [ ] Gráfico: Demandas criadas × concluídas
- [ ] Gráfico: Processos por fase
- [ ] Gráfico: Processos por área
- [ ] Gráfico: Produção por pessoa
- [ ] Cards: Prazos vencidos, do dia, próximos 7 dias
- [ ] Cards: Demandas sem dono, travadas
- [ ] Filtro de período

### Módulo 3: Processos
- [ ] CRUD completo de processos
- [ ] Campos: número CNJ, cliente, órgão, tribunal, classe, área, fase
- [ ] Busca por número CNJ
- [ ] Importação de processos
- [ ] View em lista (tabela)
- [ ] View em funil (por fase)
- [ ] Filtros avançados
- [ ] Vincular demandas/audiencias/prazos
- [ ] Documentos anexos
- [ ] Histórico de alterações

### Módulo 4: Clientes
- [ ] CRUD completo
- [ ] Cadastro PF e PJ
- [ ] Campos: nome, documento, contato, endereço
- [ ] Listagem com busca
- [ ] Histórico de processos
- [ ] Documentos anexos

### Módulo 5: Demandas (Kanban)
- [ ] Quadro Kanban com colunas configuráveis
- [ ] Cartão: título, descrição, responsável, prazo, prioridade
- [ ] Drag & drop entre colunas
- [ ] Filtros: por responsável, prazo, prioridade, processo
- [ ] Criação rápida inline
- [ ] Comentários
- [ ] Anexos
- [ ] Notificações de prazo

### Módulo 6: Agenda
- [ ] Calendário com vistas: dia, semana, mês
- [ ] CRUD de audiências
- [ ] CRUD de prazos
- [ ] Dados: tipo, data/hora, local, participantes
- [ ] Integração com Google Calendar
- [ ] Exportação ICS
- [ ] Lembretes automáticos

### Módulo 7: Financeiro
- [ ] CRUD de lançamentos (contas a pagar/receber)
- [ ] Categorias: honorários, custas, despesas
- [ ] Status: pendente, pago, vencido
- [ ] Baixa manual
- [ ] Dashboard: total a receber, a pagar, saldo
- [ ] Projeção de fluxo de caixa
- [ ] Relatórios: por período, por cliente, por categoria
- [ ] Parcelamento
- [ ] Juros e multa

### Módulo 8: Equipe
- [ ] Listar membros do escritório
- [ ] Convidar novo membro
- [ ] Definir função (Admin, Advogado, Estagiário, Secretário)
- [ ] Definir perfil de acesso
- [ ] Ativar/desativar membro
- [ ] Permissões granulares

### Módulo 9: Integrações
- [ ] Configuração de API keys
- [ ] Integração com TJRN
- [ ] Integração com TJSP
- [ ] Integração com DataJud (CNJ)
- [ ] Sincronização automática de publicações
- [ ] Notificações de novas publicações
- [ ] Sync manual sob demanda

### Módulo 10: Configurações
- [ ] Dados do escritório (nome, logo, CNPJ)
- [ ] Notificações (e-mail, SMS)
- [ ] Aparência (tema, cores)
- [ ] Colunas do Kanban
- [ ] Backup

### Módulo 11: Inbox/Publicações
- [ ] Lista de publicações recebidas
- [ ] Filtros por tribunal, data, tipo
- [ ] Marcar como lida/não lida
- [ ] Triagem (vincular a processo)
- [ ] Obs para cada publicação

---

## 8. Plano de Implementação

### Fase 1: Foundation (Semanas 1-4)
1. **Setup do projeto**
   - [ ] Repositório Git
   - [ ] Monorepo (Turborepo)
   - [ ] Docker Compose local
   - [ ] PostgreSQL + Prisma

2. **Autenticação**
   - [ ] Schema de tenant
   - [ ] CRUD de usuários
   - [ ] Login/Logout/Register
   - [ ] JWT + Refresh Token
   - [ ] Middleware de auth

3. **Layout base**
   - [ ] Sidebar responsiva
   - [ ] Header com user menu
   - [ ] Tema claro/escuro

### Fase 2: Core Modules (Semanas 5-10)

4. **Clientes**
   - [ ] CRUD completo
   - [ ] Listagem com filtros
   - [ ] Validações

5. **Processos**
   - [ ] CRUD completo
   - [ ] Campos processuais
   - [ ] Views lista/funil
   - [ ] Busca CNJ

6. **Demandas/Kanban**
   - [ ] Quadro Kanban
   - [ ] CRUD de demandas
   - [ ] Drag & drop
   - [ ] Comentários

7. **Agenda**
   - [ ] Calendário
   - [ ] Audiências
   - [ ] Prazos

### Fase 3: Advanced (Semanas 11-14)

8. **Financeiro**
   - [ ] CRUD lançamentos
   - [ ] Dashboard
   - [ ] Baixa de pagamentos

9. **Integrações**
   - [ ] API TJ
   - [ ] Sync de publicações
   - [ ] Notificações

10. **Polish**
    - [ ] Perfis de acesso
    - [ ] Audit log
    - [ ] Backup

### Fase 4: Launch (Semanas 15-16)
- [ ] Deploy em VPS
- [ ] SSL/HTTPS
- [ ] Monitoramento
- [ ] Beta testers

---

## 9. Requisitos Não-Funcionais

### Performance
- Tempo de carregamento inicial < 3s
- TTFB < 200ms
- Lighthouse Score > 90

### Segurança
- HTTPS em todas as requisições
- Senhas com bcrypt (cost 12+)
- Rate limiting em APIs
- Input sanitization
- RLS ativa no PostgreSQL

### Acessibilidade
- WCAG 2.1 AA
- Keyboard navigation
- Screen reader compatible
- Contrast ratio adequado

### Responsividade
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+

---

## 10. Glossário

| Termo | Definição |
|-------|-----------|
| Tenant | Escritório de advocacia (unidade de negócio) |
| CNJ | Conselho Nacional de Justiça |
| CNJ (formato) | Número de processo no formato 0000000-00.0000.0.00.0000 |
| TJ | Tribunal de Justiça |
| PJe | Processo Judicial Eletrônico |
| RLS | Row-Level Security (segurança em nível de linha) |
| SLA | Service Level Agreement |
| Honorários | Valor pago ao advogado |
| Sucumbência | Honorários definidos pelo juiz |

---

## 11. Referências

- Advcontroller (referência visual)
- Escriba (benchmark)
- Advocacia 365 (benchmark)
- Lexbot (benchmark)

---

*Este documento é a fonte de verdade para o desenvolvimento do Gubernajur. Todas as decisões técnicas devem ser rastreadas aqui.*
