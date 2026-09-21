import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiGet } from '@/lib/api'
import { DemandasClient } from './DemandasClient'

export const dynamic = 'force-dynamic'

type Demanda = {
  id: string
  titulo: string
  descricao: string | null
  status: string
  prioridade: string
  prazo: string | null
  processo: { id: string; numeroCNJ: string } | null
  tags: string[]
  concluidaEm: string | null
}
type Processo = { id: string; numeroCNJ: string }

export default async function DemandasPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  let demandas: Demanda[] = []
  let processos: Processo[] = []
  try {
    [demandas, processos] = await Promise.all([
      apiGet<Demanda[]>('/api/demandas'),
      apiGet<Processo[]>('/api/processos'),
    ])
  } catch {}

  return (
    <DemandasClient
      initialDemandas={Array.isArray(demandas) ? demandas : []}
      processos={Array.isArray(processos) ? processos : []}
    />
  )
}
