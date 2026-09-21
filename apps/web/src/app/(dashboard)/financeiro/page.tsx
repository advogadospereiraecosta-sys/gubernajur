import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiGet } from '@/lib/api'
import { FinanceiroClient } from './FinanceiroClient'

export const dynamic = 'force-dynamic'

type Cliente = { id: string; nome: string }
type Lancamento = {
  id: string
  descricao: string
  tipo: 'RECEITA' | 'DESPESA'
  categoria: string
  valor: string
  dataVencimento: string
  dataPagamento: string | null
  status: string
  cliente: Cliente | null
}

export default async function FinanceiroPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  let lancamentos: Lancamento[] = []
  let clientes: Cliente[] = []
  try {
    [lancamentos, clientes] = await Promise.all([
      apiGet<Lancamento[]>('/api/financeiro'),
      apiGet<Cliente[]>('/api/clientes'),
    ])
  } catch {}

  return (
    <FinanceiroClient
      initialLancamentos={Array.isArray(lancamentos) ? lancamentos : []}
      clientes={Array.isArray(clientes) ? clientes : []}
      initialResumo={null}
    />
  )
}
