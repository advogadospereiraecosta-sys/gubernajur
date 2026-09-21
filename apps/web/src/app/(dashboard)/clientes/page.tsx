import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiGet } from '@/lib/api'
import { ClientesClient } from './ClientesClient'

export const dynamic = 'force-dynamic'

type Cliente = {
  id: string
  tipoPessoa: string
  nome: string
  cpfCnpj: string | null
  email: string | null
  telefone: string | null
  cidade: string | null
  estado: string | null
  createdAt: string
}

export default async function ClientesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  let clientes: Cliente[] = []
  try {
    clientes = await apiGet<Cliente[]>('/api/clientes')
  } catch {}

  return <ClientesClient initialClientes={Array.isArray(clientes) ? clientes : []} />
}
