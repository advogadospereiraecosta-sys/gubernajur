import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiGet } from '@/lib/api'
import { ProcessosClient } from './ProcessosClient'

export const dynamic = 'force-dynamic'

type Cliente = { id: string; nome: string }
type Processo = {
  id: string
  numeroCNJ: string
  cliente: Cliente
  classe: string
  area: string
  fase: string
  tribunal: string
  orgaoJulgador: string
  valorCausa: string | null
  dataAjuizamento: string
}

export default async function ProcessosPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  let processos: Processo[] = []
  let clientes: Cliente[] = []
  try {
    [processos, clientes] = await Promise.all([
      apiGet<Processo[]>('/api/processos'),
      apiGet<Cliente[]>('/api/clientes'),
    ])
  } catch {}

  return (
    <ProcessosClient
      initialProcessos={Array.isArray(processos) ? processos : []}
      clientes={Array.isArray(clientes) ? clientes : []}
    />
  )
}
