import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import {
  REVISIONAL_TOOLS,
  REVISIONAL_EXECUTORS,
  REVISIONAL_POR_PERFIL,
} from '@/lib/revisional/mcp-tools'

/**
 * JSON-RPC 2.0 MCP server for Claude connector.
 *
 * Flow:
 *   1) Client POSTs initialize → we return protocolVersion + capabilities
 *   2) Client POSTs tools/list   → we return all available tools
 *   3) Client POSTs tools/call   → we execute the tool, return content
 *
 * Authentication:
 *   - HTTP: Authorization: Bearer <jwt>
 *   - Or alternatively X-Gubernajur-Token: <jwt> for non-Authorization clients
 *
 * In production we verify the JWT against JWT_SECRET.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type JsonRpcRequest = {
  jsonrpc: '2.0'
  id?: number | string
  method: string
  params?: any
}

const TOOLS_BASE = [
  {
    name: 'listar_prazos_vencendo',
    description:
      'Lista os prazos do escritório que vencem nos próximos N dias (padrão 7). Agrupa por responsável e inclui o status (pendente/concluído/atrasado).',
    inputSchema: {
      type: 'object',
      properties: {
        dias: {
          type: 'number',
          description: 'Janela em dias a partir de hoje. Padrão 7.',
          default: 7,
        },
        escritorioId: {
          type: 'string',
          description: 'ID do escritório. Opcional — usa o do token se omitido.',
        },
      },
    },
  },
  {
    name: 'listar_publicacoes_nao_triadas',
    description:
      'Lista publicações que ainda não foram triadas (lidas/classificadas) pelo escritório. Retorna as mais recentes primeiro.',
    inputSchema: {
      type: 'object',
      properties: {
        limite: { type: 'integer', description: 'Quantidade máxima (padrão 20).', default: 20 },
        escritorioId: { type: 'string' },
      },
    },
  },
  {
    name: 'listar_demandas_paradas',
    description: 'Lista demandas (tarefas internas) que estão paradas há mais de N dias sem atualização.',
    inputSchema: {
      type: 'object',
      properties: {
        dias: { type: 'integer', description: 'Dias de inatividade (padrão 7).', default: 7 },
        limite: { type: 'integer', default: 30 },
        escritorioId: { type: 'string' },
      },
    },
  },
  {
    name: 'buscar_cliente',
    description: 'Busca clientes por nome (parcial, case-insensitive). Retorna dados básicos + processos vinculados.',
    inputSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', description: 'Nome (ou parte) do cliente.' },
        limite: { type: 'integer', default: 10 },
        escritorioId: { type: 'string' },
      },
      required: ['nome'],
    },
  },
  {
    name: 'listar_processos_cliente',
    description: 'Lista processos vinculados a um cliente específico.',
    inputSchema: {
      type: 'object',
      properties: {
        clienteId: { type: 'string', description: 'ID do cliente.' },
        limite: { type: 'integer', default: 50 },
        escritorioId: { type: 'string' },
      },
      required: ['clienteId'],
    },
  },
  {
    name: 'resumo_financeiro',
    description:
      'Retorna um resumo financeiro do escritório: total a receber, recebido, a pagar e saldo do período (mês atual por padrão).',
    inputSchema: {
      type: 'object',
      properties: {
        ano: { type: 'integer', description: 'Ano de referência. Padrão = ano atual.' },
        mes: { type: 'integer', description: 'Mês (1-12). Padrão = mês atual.' },
        escritorioId: { type: 'string' },
      },
    },
  },
  {
    name: 'listar_audiencias_proximas',
    description: 'Lista audiências marcadas para os próximos N dias.',
    inputSchema: {
      type: 'object',
      properties: {
        dias: { type: 'integer', description: 'Janela em dias (padrão 14).', default: 14 },
        escritorioId: { type: 'string' },
      },
    },
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Auth helper
// ─────────────────────────────────────────────────────────────────────────────

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim()
  const alt = req.headers.get('x-gubernajur-token')
  return alt?.trim() || null
}

function decodeJwt(token: string): { escritorioId?: string; sub?: string; email?: string; exp?: number } | null {
  try {
    const secret = process.env.MCP_CLIENT_SECRET || process.env.JWT_SECRET
    if (!secret) return null

    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] }) as {
      escritorioId?: string
      sub?: string
      email?: string
      exp?: number
    }
    return payload
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Perfil access control
// ─────────────────────────────────────────────────────────────────────────────

type Perfil = 'ADMIN' | 'ADVOGADO' | 'BASICO'

/** Tools permitted by profile — each profile sees only its allowed subset. */
// Produto "Revisional de Financiamento de Veículo" — definidas em
// lib/revisional/mcp-tools.ts para não inchar este arquivo.
const TOOLS = [...TOOLS_BASE, ...REVISIONAL_TOOLS]

const TOOLS_BY_PERFIL: Record<Exclude<Perfil, 'ADMIN'>, string[]> = {
  ADVOGADO: [
    'listar_prazos_vencendo',
    'listar_publicacoes_nao_triadas',
    'listar_demandas_paradas',
    'buscar_cliente',
    'listar_processos_cliente',
    'listar_audiencias_proximas',
    ...REVISIONAL_POR_PERFIL.ADVOGADO,
  ],
  BASICO: [
    'listar_prazos_vencendo',
    'buscar_cliente',
    'listar_audiencias_proximas',
    ...REVISIONAL_POR_PERFIL.BASICO,
  ],
}

async function getUserPerfil(userId: string, escritorioId: string): Promise<Perfil> {
  const user = await prisma.usuario.findFirst({
    where: { id: userId, escritorioId },
    select: { perfil: true },
  })
  return (user?.perfil as Perfil) ?? 'BASICO'
}

function filterToolsByPerfil(tools: typeof TOOLS, perfil: Perfil): typeof TOOLS {
  if (perfil === 'ADMIN') return tools // ADMIN sees everything
  const allowed = new Set(TOOLS_BY_PERFIL[perfil])
  return tools.filter((t) => allowed.has(t.name))
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool executors
// ─────────────────────────────────────────────────────────────────────────────

async function toolListarPrazosVencendo(args: any, escritorioId: string) {
  const dias = Math.min(Math.max(Number(args?.dias ?? 7), 1), 90)
  const agora = new Date()
  const ate = new Date(agora.getTime() + dias * 24 * 60 * 60 * 1000)

  const prazos = await prisma.prazo.findMany({
    where: {
      escritorioId,
      NOT: { status: { in: ['CONCLUIDO', 'CANCELADO'] } },
      dataFinal: { gte: agora, lte: ate },
    },
    include: {
      processo: { select: { numeroCNJ: true, cliente: { select: { nome: true } } } },
    },
    orderBy: { dataFinal: 'asc' },
    take: 200,
  })

  const grupos: Record<string, any[]> = {}
  for (const p of prazos) {
    const key = p.responsavel ?? 'Sem responsável'
    if (!grupos[key]) grupos[key] = []
    grupos[key].push({
      id: p.id,
      titulo: p.descricao,
      tipo: p.tipo,
      dataVencimento: p.dataFinal.toISOString(),
      status: p.status,
      responsavel: p.responsavel ?? null,
      processoNumero: p.processo?.numeroCNJ ?? null,
      cliente: p.processo?.cliente?.nome ?? null,
    })
  }

  return {
    total: prazos.length,
    janelaDias: dias,
    porResponsavel: grupos,
  }
}

async function toolListarPublicacoesNaoTriadas(args: any, escritorioId: string) {
  const limite = Math.min(Math.max(Number(args?.limite ?? 20), 1), 100)
  const pubs = await prisma.publicacao.findMany({
    where: { escritorioId, triadaEm: null },
    include: {
      processo: { select: { numeroCNJ: true, cliente: { select: { nome: true } } } },
    },
    orderBy: { dataPublicacao: 'desc' },
    take: limite,
  })
  return {
    total: pubs.length,
    itens: pubs.map((p) => ({
      id: p.id,
      tipo: p.tipo,
      tribunal: p.tribunal,
      dataPublicacao: p.dataPublicacao.toISOString(),
      resumo: (p.conteudo ?? '').slice(0, 200),
      processoNumero: p.processo?.numeroCNJ ?? null,
      cliente: p.processo?.cliente?.nome ?? null,
    })),
  }
}

async function toolListarDemandasParadas(args: any, escritorioId: string) {
  const dias = Math.min(Math.max(Number(args?.dias ?? 7), 1), 90)
  const limite = Math.min(Math.max(Number(args?.limite ?? 30), 1), 100)
  const cutoff = new Date(Date.now() - dias * 24 * 60 * 60 * 1000)

  const demandas = await prisma.demanda.findMany({
    where: {
      escritorioId,
      status: { in: ['A_FAZER', 'EM_ANDAMENTO', 'EM_REVISAO'] },
      updatedAt: { lt: cutoff },
    },
    include: {
      responsavel: { select: { nome: true } },
      processo: { select: { numeroCNJ: true, cliente: { select: { nome: true } } } },
    },
    orderBy: { updatedAt: 'asc' },
    take: limite,
  })

  return {
    total: demandas.length,
    diasParada: dias,
    itens: demandas.map((d) => ({
      id: d.id,
      titulo: d.titulo,
      status: d.status,
      prioridade: d.prioridade,
      responsavel: d.responsavel?.nome ?? null,
      cliente: d.processo?.cliente?.nome ?? null,
      processoNumero: d.processo?.numeroCNJ ?? null,
      updatedAt: d.updatedAt.toISOString(),
    })),
  }
}

async function toolBuscarCliente(args: any, escritorioId: string) {
  const nome = String(args?.nome ?? '').trim()
  if (!nome) throw new Error('Parâmetro "nome" é obrigatório')
  const limite = Math.min(Math.max(Number(args?.limite ?? 10), 1), 50)

  const clientes = await prisma.cliente.findMany({
    where: { escritorioId, nome: { contains: nome, mode: 'insensitive' } },
    include: {
      _count: { select: { processos: true } },
    },
    orderBy: { nome: 'asc' },
    take: limite,
  })

  return {
    total: clientes.length,
    itens: clientes.map((c) => ({
      id: c.id,
      nome: c.nome,
      tipo: c.tipoPessoa,
      documento: c.cpfCnpj,
      email: c.email,
      telefone: c.celular ?? c.telefone,
      processos: c._count.processos,
    })),
  }
}

async function toolListarProcessosCliente(args: any, escritorioId: string) {
  const clienteId = String(args?.clienteId ?? '').trim()
  if (!clienteId) throw new Error('Parâmetro "clienteId" é obrigatório')
  const limite = Math.min(Math.max(Number(args?.limite ?? 50), 1), 200)

  const processos = await prisma.processo.findMany({
    where: { escritorioId, clienteId },
    include: {
      cliente: { select: { nome: true } },
      _count: { select: { audiencias: true, prazos: true, publicacoes: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: limite,
  })

  return {
    total: processos.length,
    itens: processos.map((p) => ({
      id: p.id,
      numero: p.numeroCNJ,
      classe: p.classe,
      tribunal: p.tribunal,
      instancia: p.instancia,
      fase: p.fase,
      area: p.area,
      valorCausa: p.valorCausa?.toString() ?? null,
      dataAjuizamento: p.dataAjuizamento.toISOString(),
      cliente: p.cliente.nome,
      totais: {
        audiencias: p._count.audiencias,
        prazos: p._count.prazos,
        publicacoes: p._count.publicacoes,
      },
    })),
  }
}

async function toolResumoFinanceiro(args: any, escritorioId: string) {
  const now = new Date()
  const ano = Number(args?.ano ?? now.getFullYear())
  const mes = Math.max(1, Math.min(12, Number(args?.mes ?? now.getMonth() + 1)))
  const inicio = new Date(Date.UTC(ano, mes - 1, 1))
  const fim = new Date(Date.UTC(ano, mes, 1))

  const [contasReceber, contasPagar] = await Promise.all([
    prisma.financeiro.findMany({
      where: {
        escritorioId,
        tipo: 'RECEITA',
        dataVencimento: { gte: inicio, lt: fim },
      },
    }),
    prisma.financeiro.findMany({
      where: {
        escritorioId,
        tipo: 'DESPESA',
        dataVencimento: { gte: inicio, lt: fim },
      },
    }),
  ])

  const sumByStatus = (arr: any[]) => {
    const res = { pendente: 0, recebido: 0, vencido: 0 }
    for (const l of arr) {
      const v = Number(l.valor ?? 0)
      if (l.status === 'PAGO') res.recebido += v
      else if (l.status === 'VENCIDO' || (l.status === 'PENDENTE' && l.dataVencimento < now)) res.vencido += v
      else res.pendente += v
    }
    return res
  }

  const rec = sumByStatus(contasReceber)
  const pag = sumByStatus(contasPagar)

  return {
    periodo: { ano, mes, label: inicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) },
    receitas: { ...rec, total: rec.pendente + rec.recebido + rec.vencido },
    despesas: { ...pag, total: pag.pendente + pag.recebido + pag.vencido },
    saldoPrevisto: rec.recebido + rec.pendente - pag.recebido - pag.pendente,
    saldoRealizado: rec.recebido - pag.recebido,
  }
}

async function toolListarAudienciasProximas(args: any, escritorioId: string) {
  const dias = Math.min(Math.max(Number(args?.dias ?? 14), 1), 90)
  const agora = new Date()
  const ate = new Date(agora.getTime() + dias * 24 * 60 * 60 * 1000)

  const auds = await prisma.audiencia.findMany({
    where: {
      escritorioId,
      dataHora: { gte: agora, lte: ate },
    },
    include: {
      processo: { select: { numeroCNJ: true, cliente: { select: { nome: true } } } },
    },
    orderBy: { dataHora: 'asc' },
    take: 50,
  })

  return {
    total: auds.length,
    janelaDias: dias,
    itens: auds.map((a) => ({
      id: a.id,
      tipo: a.tipo,
      dataInicio: a.dataHora.toISOString(),
      duracao: a.duracao ?? null,
      local: a.local ?? null,
      modalidade: a.tipoLocal,
      pauta: a.pauta ?? null,
      processoNumero: a.processo?.numeroCNJ ?? null,
      cliente: a.processo?.cliente?.nome ?? null,
    })),
  }
}

const TOOL_EXECUTORS: Record<string, (args: any, escritorioId: string) => Promise<any>> = {
  listar_prazos_vencendo: toolListarPrazosVencendo,
  listar_publicacoes_nao_triadas: toolListarPublicacoesNaoTriadas,
  listar_demandas_paradas: toolListarDemandasParadas,
  buscar_cliente: toolBuscarCliente,
  listar_processos_cliente: toolListarProcessosCliente,
  resumo_financeiro: toolResumoFinanceiro,
  listar_audiencias_proximas: toolListarAudienciasProximas,
  ...REVISIONAL_EXECUTORS,
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON-RPC handlers
// ─────────────────────────────────────────────────────────────────────────────

function rpcError(id: any, code: number, message: string) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } }
}

function rpcResult(id: any, result: any) {
  return { jsonrpc: '2.0', id, result }
}

async function handleRpc(body: JsonRpcRequest, escritorioId: string, perfil: Perfil) {
  const { id, method, params } = body

  switch (method) {
    case 'initialize': {
      return rpcResult(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'gubernajur-mcp', version: '1.0.0' },
      })
    }

    case 'notifications/initialized': {
      return rpcResult(id, {})
    }

    case 'ping': {
      return rpcResult(id, {})
    }

    case 'tools/list': {
      return rpcResult(id, { tools: filterToolsByPerfil(TOOLS, perfil) })
    }

    case 'tools/call': {
      const name = String(params?.name ?? '')
      const args = params?.arguments ?? {}

      const allowedNames =
        perfil === 'ADMIN'
          ? TOOLS.map((t) => t.name)
          : TOOLS_BY_PERFIL[perfil]

      if (!allowedNames.includes(name)) {
        return rpcError(id, -32602, `Ferramenta não autorizada para seu perfil (${perfil}): ${name}`)
      }

      const executor = TOOL_EXECUTORS[name]
      if (!executor) {
        return rpcError(id, -32602, `Ferramenta desconhecida: ${name}`)
      }
      try {
        const ts = Date.now()
        const data = await executor(args, escritorioId)
        return rpcResult(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ escritorioId, ferramenta: name, latenciaMs: Date.now() - ts, ...data }, null, 2),
            },
          ],
          isError: false,
        })
      } catch (e: any) {
        return rpcResult(id, {
          content: [{ type: 'text', text: `Erro ao executar ${name}: ${e.message ?? String(e)}` }],
          isError: true,
        })
      }
    }

    case 'resources/list':
    case 'resources/read':
    case 'resources/templates/list': {
      return rpcResult(id, { resources: [] })
    }

    default:
      return rpcError(id, -32601, `Método não implementado: ${method}`)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP entry
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: JsonRpcRequest | JsonRpcRequest[]
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(rpcError(null, -32700, 'Parse error'))
  }

  const params = (body as any).params

  const token = extractToken(req)
  if (!token) {
    return NextResponse.json(rpcError(null, -32000, 'Missing Authorization Bearer token'), { status: 401 })
  }

  const payload = decodeJwt(token)
  if (!payload) {
    return NextResponse.json(rpcError(null, -32000, 'Invalid token'), { status: 401 })
  }

  const escritorioIdQ = req.nextUrl.searchParams.get('escritorioId')
  const escritorioId =
    escritorioIdQ ||
    payload.escritorioId ||
    (params && typeof params === 'object' ? params.escritorioId : undefined)
  if (!escritorioId) {
    return NextResponse.json(
      rpcError(
        null,
        -32000,
        'Missing escritorioId — envie via query ?escritorioId=, claim JWT escritorioId, ou params.escritorioId no body',
      ),
      { status: 401 },
    )
  }

  const perfil = await getUserPerfil(payload.sub!, escritorioId)

  if (Array.isArray(body)) {
    const responses = await Promise.all(body.map((r) => handleRpc(r, escritorioId, perfil)))
    return NextResponse.json(responses)
  }

  const response = await handleRpc(body, escritorioId, perfil)

  prisma.integracao
    .updateMany({
      where: { escritorioId, tipo: 'CLAUDE' },
      data: { ultimaSincronizacao: new Date() },
    })
    .catch(() => {})

  return NextResponse.json(response)
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    name: 'gubernajur-mcp',
    version: '1.0.0',
    protocol: 'mcp',
    protocolVersion: '2024-11-05',
    methods: ['initialize', 'tools/list', 'tools/call', 'ping'],
    tools: TOOLS.map((t) => t.name),
    auth: 'Authorization: Bearer <jwt>',
    status: 'ok',
  })
}
