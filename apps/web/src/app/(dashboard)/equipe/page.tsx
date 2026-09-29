import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiGet } from '@/lib/api'
import { EquipeClient } from './EquipeClient'

export const dynamic = 'force-dynamic'

type Membro = {
  id: string
  nome: string
  email: string
  funcao: string
  perfil: string
  avatar: string | null
  ultimoLogin: string | null
}

export default async function EquipePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  let membros: Membro[] = []
  try {
    membros = await apiGet<Membro[]>('/api/usuarios')
  } catch {}

  return (
    <EquipeClient
      membros={Array.isArray(membros) ? membros : []}
      podeGerenciar={session.user.role === 'ADMIN'}
      meuId={session.user.id}
    />
  )
}
