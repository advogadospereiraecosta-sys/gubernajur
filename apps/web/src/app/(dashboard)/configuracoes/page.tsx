import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiGet } from '@/lib/api'
import { ConfiguracoesClient } from './ConfiguracoesClient'

export const dynamic = 'force-dynamic'

type Escritorio = {
  id: string
  nome: string
  cnpj: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  plano: string
}

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  let escritorio: Escritorio | null = null
  try {
    escritorio = await apiGet<Escritorio>('/api/escritorios/me')
  } catch {}

  return (
    <ConfiguracoesClient
      escritorio={escritorio}
      usuario={{
        id: session.user.id,
        nome: session.user.name || '',
        email: session.user.email || '',
        telefone: null,
        avatar: null,
      }}
    />
  )
}
