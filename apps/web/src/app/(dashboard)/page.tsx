import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiGet } from '@/lib/api'
import { DashboardClient } from './DashboardClient'

export const dynamic = 'force-dynamic'

type Cliente = { id: string }
type Processo = { id: string }
type Audiencia = { id: string; titulo: string; dataHora: string }
type Prazo = { id: string; titulo: string; dataVencimento: string; diasRestantes: number; status: string }
type Demanda = { id: string; status: string }
type Publicacao = { id: string; lida: boolean }
type Lancamento = {
  id: string
  tipo: 'RECEITA' | 'DESPESA'
  valor: string
  dataPagamento: string | null
  status: string
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  let clientes: Cliente[] = []
  let processos: Processo[] = []
  let audiencias: Audiencia[] = []
  let prazos: Prazo[] = []
  let demandas: Demanda[] = []
  let publicacoes: Publicacao[] = []
  let lancamentos: Lancamento[] = []

  try {
    const [c, p, a, pr, d, pub, fin] = await Promise.all([
      apiGet<Cliente[]>('/api/clientes'),
      apiGet<Processo[]>('/api/processos'),
      apiGet<Audiencia[]>('/api/audiencias'),
      apiGet<Prazo[]>('/api/prazos'),
      apiGet<Demanda[]>('/api/demandas'),
      apiGet<Publicacao[]>('/api/publicacoes'),
      apiGet<Lancamento[]>('/api/financeiro'),
    ])
    clientes = Array.isArray(c) ? c : []
    processos = Array.isArray(p) ? p : []
    audiencias = Array.isArray(a) ? a : []
    prazos = Array.isArray(pr) ? pr : []
    demandas = Array.isArray(d) ? d : []
    publicacoes = Array.isArray(pub) ? pub : []
    lancamentos = Array.isArray(fin) ? fin : []
  } catch {}

  // Calcula métricas
  const agora = new Date()
  const em7Dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const audienciasProximas = audiencias.filter((a) => {
    const d = new Date(a.dataHora)
    return d >= agora && d <= em7Dias
  }).length

  const prazosUrgentes = prazos.filter(
    (p) => p.status === 'PENDENTE' && p.diasRestantes <= 3 && p.diasRestantes >= 0
  ).length

  const demandasPendentes = demandas.filter(
    (d) => d.status !== 'CONCLUIDO' && d.status !== 'CANCELADO'
  ).length

  const publicacoesNaoLidas = publicacoes.filter((p) => !p.lida).length

  const receitasMes = lancamentos
    .filter((l) => l.tipo === 'RECEITA' && l.status === 'PAGO' && l.dataPagamento && new Date(l.dataPagamento) >= inicioMes)
    .reduce((s, l) => s + Number(l.valor), 0)

  const despesasMes = lancamentos
    .filter((l) => l.tipo === 'DESPESA' && l.status === 'PAGO' && l.dataPagamento && new Date(l.dataPagamento) >= inicioMes)
    .reduce((s, l) => s + Number(l.valor), 0)

  // Próximas atividades
  const proximas = [
    ...audiencias
      .filter((a) => new Date(a.dataHora) >= agora)
      .slice(0, 5)
      .map((a) => ({ tipo: 'audiencia' as const, titulo: a.titulo, data: a.dataHora })),
    ...prazos
      .filter((p) => p.status === 'PENDENTE')
      .slice(0, 5)
      .map((p) => ({
        tipo: 'prazo' as const,
        titulo: p.titulo,
        data: p.dataVencimento,
        urgente: p.diasRestantes <= 3,
      })),
  ]
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(0, 10)

  return (
    <DashboardClient
      stats={{
        clientes: clientes.length,
        processos: processos.length,
        audienciasProximas,
        prazosUrgentes,
        receitasMes,
        despesasMes,
        saldoMes: receitasMes - despesasMes,
        demandasPendentes,
        publicacoesNaoLidas,
      }}
      proximas={proximas}
    />
  )
}
