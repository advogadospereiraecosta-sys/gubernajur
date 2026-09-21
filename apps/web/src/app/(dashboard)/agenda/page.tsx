import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiGet } from '@/lib/api'
import { AgendaClient } from './AgendaClient'

export const dynamic = 'force-dynamic'

type Audiencia = {
  id: string
  titulo: string
  tipo: string
  dataHora: string
  duracao: number
  local: string | null
  observacoes: string | null
  status: string
  processo: { id: string; numeroCNJ: string } | null
}
type Prazo = {
  id: string
  titulo: string
  tipo: string
  dataVencimento: string
  status: string
  processo: { id: string; numeroCNJ: string } | null
  diasRestantes: number
}
type Processo = { id: string; numeroCNJ: string }

export default async function AgendaPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  let audiencias: Audiencia[] = []
  let prazos: Prazo[] = []
  let processos: Processo[] = []
  try {
    [audiencias, prazos, processos] = await Promise.all([
      apiGet<Audiencia[]>('/api/audiencias'),
      apiGet<Prazo[]>('/api/prazos'),
      apiGet<Processo[]>('/api/processos'),
    ])
  } catch {}

  return (
    <AgendaClient
      initialAudiencias={Array.isArray(audiencias) ? audiencias : []}
      initialPrazos={Array.isArray(prazos) ? prazos : []}
      processos={Array.isArray(processos) ? processos : []}
    />
  )
}
