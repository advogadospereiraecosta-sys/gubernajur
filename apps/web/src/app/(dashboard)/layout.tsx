import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { apiGet } from '@/lib/api'
import { Sidebar, type SidebarContadores } from '@/components/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const escritorioNome = (session.user as any).escritorioNome ?? 'Meu escritório'
  const userName = session.user.name ?? 'Usuário'
  const userEmail = session.user.email ?? ''

  // Contadores da sidebar — uma chamada por módulo; falhas viram 0.
  const contadores: SidebarContadores = {
    publicacoes: 0,
    publicacoesNaoLidas: 0,
    prazos: 0,
    audiencias: 0,
    demandas: 0,
    financeiro: 0,
    equipe: 0,
    notificacoes: 0,
    integracoes: 0,
  }

  try {
    const [pubs, naoLidas, prazos, auds, dems, equipe, fin] = await Promise.all([
      apiGet<any[]>('/api/publicacoes').catch(() => []),
      apiGet<any[]>('/api/publicacoes/nao-lidas').catch(() => []),
      apiGet<any[]>('/api/prazos').catch(() => []),
      apiGet<any[]>('/api/audiencias').catch(() => []),
      apiGet<any[]>('/api/demandas').catch(() => []),
      apiGet<any[]>('/api/usuarios').catch(() => []),
      apiGet<any[]>('/api/financeiro').catch(() => []),
    ])
    contadores.publicacoes = Array.isArray(pubs) ? pubs.length : 0
    contadores.publicacoesNaoLidas = Array.isArray(naoLidas) ? naoLidas.length : 0
    contadores.prazos = Array.isArray(prazos) ? prazos.length : 0
    contadores.audiencias = Array.isArray(auds) ? auds.length : 0
    contadores.demandas = Array.isArray(dems) ? dems.length : 0
    contadores.equipe = Array.isArray(equipe) ? equipe.length : 0
    contadores.financeiro = Array.isArray(fin) ? fin.length : 0
    contadores.integracoes = 0 // sem endpoint ainda
    contadores.notificacoes =
      contadores.publicacoesNaoLidas + contadores.prazos + contadores.audiencias
  } catch {
    // mantém zeros
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        escritorioNome={escritorioNome}
        contadores={contadores}
      />
      <main className="ml-64 min-h-screen">
        <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
