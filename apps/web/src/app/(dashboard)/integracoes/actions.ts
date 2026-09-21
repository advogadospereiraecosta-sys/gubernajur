'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type IntegracaoResumo = {
  id: string
  tipo: string
  nome: string
  status: string
  config: any
  ultimaSincronizacao: string | null
  criadoEm: string
}

const META: Record<string, { descricao: string; cor: string; icone: string; categoria: 'ativa' | 'disponivel' | 'embreve' }> = {
  CLAUDE: {
    descricao: 'Conecte seu Claude ao escritório via MCP e pergunte sobre prazos, publicações, processos e clientes direto do chat.',
    cor: '#c96442',
    icone: 'Sparkles',
    categoria: 'ativa',
  },
  GOOGLE_CALENDAR: {
    descricao: 'Sincronize audiências e prazos com seu Google Calendar.',
    cor: '#4285F4',
    icone: 'Calendar',
    categoria: 'disponivel',
  },
  EMAIL: {
    descricao: 'Receba publicações e atualizações por e-mail.',
    cor: '#0ea5e9',
    icone: 'Mail',
    categoria: 'disponivel',
  },
  WHATSAPP: {
    descricao: 'Receba notificações de prazos urgentes no WhatsApp.',
    cor: '#25D366',
    icone: 'MessageCircle',
    categoria: 'disponivel',
  },
  TJRN: { descricao: 'Consulta processual automática no TJRN.', cor: '#0f172a', icone: 'Scale', categoria: 'disponivel' },
  TJSP: { descricao: 'Consulta processual automática no TJSP.', cor: '#0f172a', icone: 'Scale', categoria: 'disponivel' },
  TJMG: { descricao: 'Consulta processual automática no TJMG.', cor: '#0f172a', icone: 'Scale', categoria: 'disponivel' },
  TJRJ: { descricao: 'Consulta processual automática no TJRJ.', cor: '#0f172a', icone: 'Scale', categoria: 'disponivel' },
  TJPB: { descricao: 'Consulta processual automática no TJPB.', cor: '#0f172a', icone: 'Scale', categoria: 'disponivel' },
  DATAJUD: { descricao: 'Consulta unificada via DataJud (CNJ).', cor: '#0f172a', icone: 'Database', categoria: 'disponivel' },
}

export async function listIntegracoesServer() {
  const session = await getServerSession(authOptions)
  if (!session) return { ativas: [], disponiveis: [], emBreve: [] }
  const escritorioId = session.user.escritorioId

  const rows = await prisma.integracao.findMany({
    where: { escritorioId },
    orderBy: [{ tipo: 'asc' }, { criadoEm: 'desc' }],
  })

  const ativas = rows
    .filter((r) => r.status === 'ATIVA')
    .map((r) => ({ ...r, criadoEm: r.criadoEm.toISOString(), ultimaSincronizacao: r.ultimaSincronizacao?.toISOString() ?? null }))

  const ativasTipos = new Set(ativas.map((a) => a.tipo))
  const disponiveis = Object.entries(META)
    .filter(([tipo, m]) => m.categoria === 'disponivel' && !ativasTipos.has(tipo as any))
    .map(([tipo, m]) => ({ tipo, ...m }))

  const emBreve = [
    { tipo: 'JURISPRUDENCIA', nome: 'Base de Jurisprudência', descricao: 'Pesquisa semântica em STF/STJ/TJs.', icone: 'BookOpen', cor: '#7c3aed' },
    { tipo: 'ASSINATURA', nome: 'Assinatura Digital ICP-Brasil', descricao: 'Assine petições com certificado A1/A3.', icone: 'PenTool', cor: '#dc2626' },
  ]

  return { ativas, disponiveis, emBreve }
}

export async function ativarIntegracaoServer(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Não autenticado')
  const escritorioId = session.user.escritorioId

  const row = await prisma.integracao.findFirst({ where: { id, escritorioId } })
  if (!row) throw new Error('Integração não encontrada')

  return prisma.integracao.update({
    where: { id },
    data: { status: 'ATIVA', ultimaSincronizacao: new Date() },
  })
}

export async function desativarIntegracaoServer(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Não autenticado')
  const escritorioId = session.user.escritorioId

  const row = await prisma.integracao.findFirst({ where: { id, escritorioId } })
  if (!row) throw new Error('Integração não encontrada')

  return prisma.integracao.update({
    where: { id },
    data: { status: 'INATIVA' },
  })
}

export async function criarIntegracaoServer(input: { tipo: string; nome: string; config?: any }) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Não autenticado')
  const escritorioId = session.user.escritorioId

  // dedupe: se já existe, atualiza
  const existente = await prisma.integracao.findFirst({
    where: { escritorioId, tipo: input.tipo as any },
  })
  if (existente) {
    return prisma.integracao.update({
      where: { id: existente.id },
      data: { nome: input.nome, status: 'ATIVA', config: input.config ?? existente.config, ultimaSincronizacao: new Date() },
    })
  }

  return prisma.integracao.create({
    data: {
      escritorioId,
      tipo: input.tipo as any,
      nome: input.nome,
      status: 'ATIVA',
      config: input.config ?? undefined,
      ultimaSincronizacao: new Date(),
    },
  })
}
