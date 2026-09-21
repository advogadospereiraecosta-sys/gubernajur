import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiGet } from '@/lib/api'
import { PublicacoesClient } from './PublicacoesClient'

export const dynamic = 'force-dynamic'

type Publicacao = {
  id: string
  tribunal: string
  tipo: string
  conteudo: string
  dataPublicacao: string
  lida: boolean
  processoId: string
}

export default async function PublicacoesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  let publicacoes: Publicacao[] = []
  try {
    publicacoes = await apiGet<Publicacao[]>('/api/publicacoes')
  } catch {}

  return <PublicacoesClient initialPublicacoes={Array.isArray(publicacoes) ? publicacoes : []} />
}
