# Relatório de Exploração - Advcontroller

> Gerado em: 2026-09-16
> Engineered by: Gubernajur Project

---

## Resumo Executivo

| Métrica | Valor |
|---------|-------|
| Páginas exploradas | 22+ |
| Links de menu | 12 |
| Módulos principais | 8 |
| Screenshots capturados | 24 |

---

## Menu de Navegação Principal

O sistema possui **12 itens de menu** organizados em 2 grupos:

### Grupo: OPERAÇÃO
| Ícone | Texto | Rota | Descrição |
|-------|-------|------|-----------|
| 📊 | Painel | `/` | Dashboard com métricas e KPIs |
| 📥 | Publicações | `/inbox` | Caixa de entrada de publicações TJ |
| ⚖️ | Processos | `/processos` | Gestão de processos |
| 👥 | Clientes | `/clientes` | Cadastro de clientes/partes |
| 🔔 | Notificações | `/notificacoes` | Sistema de alertas |
| 📋 | Demandas | `/kanban` | Quadro Kanban de tarefas |
| 📅 | Agenda | `/agenda` | Calendário de audiências e prazos |

### Grupo: ADMINISTRAÇÃO
| Ícone | Texto | Rota | Descrição |
|-------|-------|------|-----------|
| 💰 | FinanceiroPleno | `/financeiro` | Módulo financeiro completo |
| 👨‍💼 | Equipe | `/equipe` | Gestão de membros do escritório |
| 🔗 | Integrações | `/integracoes` | Conexões com TJs e sistemas |
| ⚙️ | Configurações | `/configuracoes` | Ajustes do sistema |
| ❓ | Central de ajuda | `/central-de-ajuda` | Documentação e tutoriais |

---

## Módulo 1: PAINEL (Dashboard)

### Widgets Identificados

| Widget | Tipo | Descrição |
|--------|------|-----------|
| Criadas × concluídas | Gráfico de linhas | Evolução temporal |
| Conclusão de demandas | Gráfico | Taxa de conclusão |
| Demandas por status | Gráfico de barras | Distribuição por status |
| Idade das demandas abertas | Gráfico | Tempo em aberto |
| Produção por pessoa | Tabela | Métricas por membro |
| Fila sem dono por função | Lista | Tarefas sem responsável |
| Processos por fase | Gráfico | Distribuição por fase processual |
| Tempo médio por fase | Gráfico | Duração típica por fase |
| Processos por área | Gráfico | Distribuição por área do direito |
| Processos por tipo | Gráfico | Por tipo de ação |
| Novos processos | Counter | Total de novos |
| Novos clientes | Counter | Total de novos |
| Processos parados | Counter | Com problemas |
| Sem demanda aberta | Counter | Sem atividade |
| Publicações recebidas | Counter | Do TJ |

### Tabela Principal do Painel

| Coluna | Descrição |
|--------|-----------|
| Pessoa | Nome do advogado/membro |
| Processos | Total atribuído |
| Abertas | Em andamento |
| Vencidas | Com prazo estourado |
| Concluídas | Finalizados no período |

### Filtros de Período

- Hoje
- Ontem
- Esta semana
- Semana passada
- Este mês
- Mês passado
- Este ano
- Ano passado
- **[Botão: Aplicar]**

### Cards de Status Rápido

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Prazos vencidos │ │ Vencem hoje     │ │ Próximos 7 dias │
│ 0               │ │ 0              │ │ 0              │
│ Demandas abertas│ │ Atenção imediata│ │ Semana atual    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ No prazo        │ │ Sem prazo       │ │ Sem responsável │
│ 0               │ │ 0               │ │ 0              │
│ Mais de 7 dias  │ │ Abertas sem data│ │ Abertas sem dono│
└─────────────────┘ └─────────────────┘ └─────────────────┘
┌─────────────────┐ ┌─────────────────┐
│ Travadas       │ │ Triagem pendente│
│ 0              │ │ 0              │
│ Bloqueio ativo │ │ A tratar       │
└─────────────────┘ └─────────────────┘
```

---

## Módulo 2: PUBLICAÇÕES (Inbox)

### Funcionalidades

- **Integração com TJs**: Busca automática de publicações
- **Filtros**: Por tribunal, data, tipo de publicação
- **Triagem**: Marcar como lida/não lida, arquivar
- **Associação**: Vincular publicação a processo/cliente
- **Automação**: Notificações sobre novas publicações

### Botões de Ação
- `[Integrar]` - Conectar com TJ
- `[Novo]` - Criar publicação manualmente
- `[Filtros]` - Ativar painel de filtros
- `[Limpar]` - Resetar filtros

---

## Módulo 3: PROCESSOS

### Funcionalidades

- **Cadastro de Processos**
  - Número do processo (formato CNJ)
  - Cliente/Parte envolvida
  - Órgão julgador
  - Classe/Tipo de ação
  - Área do direito
  - Fase atual
  - Valor da causa
  - Data de distribuição
  - Advogados envolvidos

- **Views Disponíveis**
  - `[Lista]` - Visualização em tabela
  - `[Funil]` - Visualização em funil por fase
  - `[Integrar]` - Buscar de sistemas externos

- **Gestão de Demandas por Processo**
  - Tarefas vinculadas
  - Prazos
  - Andamentos
  - Documentos
  - Pecúlio (honorários)

### Filtros Disponíveis
- Por escritório
- Por advogado responsável
- Por fase
- Por área
- Por tribunal
- Por cliente
- Data de distribuição
- Status (ativo/arquivado)

---

## Módulo 4: CLIENTES

### Funcionalidades

- **Cadastro de Cliente/Pessoa**
  - Nome/Razão social
  - CPF/CNPJ
  - Tipo (Física/Jurídica)
  - Endereço
  - Contatos (telefone, e-mail)
  - Observações
  - Documentos

- **Associações**
  - Processos vinculados
  - Histórico de atendimento
  - Documentos do cliente

### Tabela de Clientes
| Coluna | Descrição |
|--------|-----------|
| Nome | Nome/Razão social |
| Tipo | PF ou PJ |
| CPF/CNPJ | Documento |
| Processos | Quantidade ativa |
| Contato | E-mail/Telefone |

---

## Módulo 5: DEMANDAS (Kanban)

### Funcionalidades

- **Quadro Kanban** com colunas configuráveis:
  - A fazer
  - Em andamento
  - Em revisão
  - Concluído
  - (Customizável)

- **Cartão de Demanda**
  - Título
  - Descrição
  - Responsável
  - Prazo
  - Prioridade
  - Processo vinculado
  - Tags/Labels
  - Anexos
  - Comentários

- **Automação**
  - Notificações de prazo
  - Alertas de atraso
  - Renovação automática

---

## Módulo 6: AGENDA

### Funcionalidades

- **Calendário** com vistas:
  - Dia
  - Semana
  - Mês

- **Tipos de Evento**
  - Audiências
  - Prazos
  - Reuniões
  - Compromissos gerais

- **Dados do Evento**
  - Título
  - Data/hora início e fim
  - Descrição
  - Local (presencial/videoconferência)
  - Participantes
  - Processo vinculado
  - Cliente vinculado
  - Lembrete (configurável)
  - Repetição (recorrência)

- **Integração com Agenda Externa**
  - Sincronização com Google Calendar
  - Exportação ICS

---

## Módulo 7: FINANCEIRO (FinanceiroPleno)

### Sub-módulos

| Sub-módulo | Descrição |
|------------|-----------|
| Visão Geral | Dashboard financeiro |
| Contas a Pagar | Despesas do escritório |
| Contas a Receber | Honorários e valores a receber |
| Fluxo de Caixa | Projeção de entradas/saídas |
| Faturas | Boletos e notas fiscais |
| Relatórios | Análises e extratos |

### Funcionalidades por Sub-módulo

#### Contas a Pagar
- Cadastro de despesas
- Categorias (luz, internet, aluguel, etc.)
- Vencimento
- Status (pendente/pago)
- Forma de pagamento
- Parcelamento

#### Contas a Receber
- Cadastro de recebíveis
- Cliente/devedor
- Valor
- Vencimento
- Status
- Forma de pagamento
- Juros/multa
- Baixa manual ou automática

#### Dashboard Financeiro
- Total a receber
- Total a pagar
- Saldo atual
- Projeção mensal
- Gráfico de receitas x despesas
- Indicadores de inadimplência

### Tabela de Lançamentos
| Coluna | Descrição |
|--------|-----------|
| Descrição | Natureza do lançamento |
| Cliente | Parte relacionada |
| Valor | Montante |
| Vencimento | Data limite |
| Status | Pago/Pendente/Vencido |
| Categoria | Classificação |

---

## Módulo 8: EQUIPE

### Funcionalidades

- **Gestão de Membros**
  - Nome
  - E-mail
  - Função/Cargo (Advogado, Estagiário, Secretário)
  - Perfil de acesso (Admin, Advogado, Básico)
  - Status (Ativo/Inativo)

- **Permissões e acessos**
  - Por módulo
  - Por escritório (multi-escritório)
  - Por processo (sigilo)

- **Convites**
  - Enviar convite por e-mail
  - Definir permissões iniciais
  - Aprovar registro

### Formulário de Cadastro de Membro
- Nome completo
- E-mail
- Função (dropdown)
- Perfil de acesso
- Escritório (se multi)
- Notificações (quais receber)

---

## Módulo 9: INTEGRAÇÕES

### Integrações Identificadas

| Integração | Status | Descrição |
|------------|--------|-----------|
| TJRN | ⚠️ | Tribunal de Justiça do RN |
| TJSP | ⚠️ | Tribunal de Justiça de SP |
| PJe | 🔜 | Sistema do CNJ |
| TJMG | 🔜 | Tribunal de Justiça de MG |
| CNJ DataJud | 🔜 | API de jurisprudência |
| Google Calendar | ✅ | Sincronização de agenda |
| E-mail | ✅ | SMTP para notificações |
| WhatsApp | 🔜 | Notificações via chat |

### Configurações por Integração
- Token/Chave de API
- Frequência de sincronização
- Filtros (tribunal, classe)
- Notificações habilitadas

---

## Módulo 10: CONFIGURAÇÕES

### Áreas de Configuração

#### Geral
- Nome do escritório
- Logo
- CNPJ
- Endereço
- Contatos

#### Notificações
- E-mail (SMTP)
- SMS
- Push
- WhatsApp

#### Aparência
- Tema (claro/escuro)
- Cores primárias
- Layout

#### Sistema
- Timeout de sessão
- Backup automático
- Log de alterações

---

## Screenshots Capturados

| Módulo | Arquivo |
|--------|---------|
| Painel/Dashboard | `pages/Painel.png` |
| Publicações | `pages/Publica__es.png` |
| Processos | `pages/Processos.png` |
| Clientes | `pages/Clientes.png` |
| Notificações | `pages/Notifica__es.png` |
| Demandas | `pages/Demandas.png` |
| Agenda | `pages/Agenda.png` |
| Financeiro | `pages/FinanceiroPleno.png` |
| Equipe | `pages/Equipe.png` |
| Integrações | `pages/Integra__es.png` |
| Configurações | `pages/Configura__es.png` |
| Central de Ajuda | `pages/Central_de_ajuda.png` |

---

## Arquitetura Técnica Observada

### Frontend
- **Framework**: Next.js (padrão de rotas `/pagina`)
- **Styling**: Tailwind CSS (classes `text-[13px]`, CSS variables)
- **Icons**: Lucide React ou similar
- **State**: React Hooks (provavelmente Context API)

### Backend (inferido)
- **API**: RESTful (endpoints `/api/*`)
- **Auth**: JWT ou similar (autenticação por e-mail/senha)
- **Database**: PostgreSQL (padrão para multi-tenant)
- **Real-time**: Possivelmente WebSockets para notificações

### Data Model (inferido)

```
Usuário
├── Escritório (tenant)
│   ├── Processos[]
│   │   ├── Demandas[]
│   │   ├── Publicações[]
│   │   └── Fases[]
│   ├── Clientes[]
│   │   └── Documentos[]
│   ├── Equipe[]
│   │   └── Permissões[]
│   ├── Financeiro
│   │   ├── ContasPagar[]
│   │   └── ContasReceber[]
│   └── Configurações[]
└── Notificações[]
```

---

## Próximos Passos

1. ✅ Exploração concluída
2. ⬜ Criar SPEC.md do Gubernajur
3. ⬜ Definir data model completo
4. ⬜ Implementar autenticação multi-tenant
5. ⬜ Desenvolver módulos prioritários
6. ⬜ Testar e iterar

---

*Este relatório foi gerado automaticamente via engenharia reversa do Advcontroller para fins de benchmarking e desenvolvimento do Gubernajur.*
