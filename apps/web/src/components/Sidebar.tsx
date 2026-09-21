'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  ListTodo,
  CalendarDays,
  DollarSign,
  Newspaper,
  Bell,
  Plug,
  UserCog,
  Settings,
  HelpCircle,
  LogOut,
  Scale,
  Gavel,
} from 'lucide-react'

export type SidebarContadores = {
  publicacoes: number
  publicacoesNaoLidas: number
  prazos: number
  audiencias: number
  demandas: number
  financeiro: number
  equipe: number
  notificacoes: number
  integracoes: number
}

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  countKey?: keyof SidebarContadores
  highlight?: boolean
}

const grupos: { titulo: string; itens: NavItem[] }[] = [
  {
    titulo: 'OPERAÇÃO',
    itens: [
      { href: '/painel', label: 'Painel', icon: LayoutDashboard },
      { href: '/publicacoes', label: 'Publicações', icon: Newspaper, countKey: 'publicacoes', highlight: true },
      { href: '/processos', label: 'Processos', icon: Briefcase },
      { href: '/clientes', label: 'Clientes', icon: Users },
      { href: '/notificacoes', label: 'Notificações', icon: Bell, countKey: 'notificacoes' },
      { href: '/demandas', label: 'Demandas', icon: ListTodo, countKey: 'demandas' },
      { href: '/agenda', label: 'Agenda', icon: CalendarDays },
    ],
  },
  {
    titulo: 'PRODUTOS',
    itens: [
      { href: '/revisional', label: 'Revisional de Veículo', icon: Gavel },
    ],
  },
  {
    titulo: 'ADMINISTRAÇÃO',
    itens: [
      { href: '/financeiro', label: 'Financeiro', icon: DollarSign, countKey: 'financeiro' },
      { href: '/equipe', label: 'Equipe', icon: UserCog, countKey: 'equipe' },
      { href: '/integracoes', label: 'Integrações', icon: Plug, countKey: 'integracoes' },
      { href: '/configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
]

export function Sidebar({
  userName,
  userEmail,
  escritorioNome,
  contadores,
}: {
  userName: string
  userEmail: string
  escritorioNome: string
  contadores: SidebarContadores
}) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/painel') return pathname === '/painel' || pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  function countOf(item: NavItem): number {
    if (!item.countKey) return 0
    return contadores[item.countKey] ?? 0
  }

  function badgeClasses(n: number, active: boolean, highlight: boolean) {
    if (n === 0) {
      return active ? 'bg-white/10 text-white/80' : 'bg-white/5 text-white/50'
    }
    if (highlight && active) return 'bg-orange-500/30 text-orange-200'
    return 'bg-brand-500 text-white'
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-navy-950 text-white border-r border-navy-800 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-navy-800 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-500 text-white shrink-0">
          <Scale className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-base font-bold tracking-tight leading-none">Gubernajur</div>
          <div className="text-[9px] uppercase tracking-widest text-white/40 mt-1">Gestão · Tecnologia · Resultados</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {grupos.map((g) => (
          <div key={g.titulo}>
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">
              {g.titulo}
            </div>
            <ul className="space-y-1">
              {g.itens.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                const n = countOf(item)
                const itemBase = 'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors'
                const activeClasses =
                  item.highlight && active
                    ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                    : active
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'

                return (
                  <li key={item.href}>
                    <Link href={item.href} className={`${itemBase} ${activeClasses}`}>
                      <Icon className={`h-4 w-4 shrink-0 ${active ? '' : 'text-white/60 group-hover:text-white'}`} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {n > 0 && (
                        <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${badgeClasses(n, active, !!item.highlight)}`}>
                          {n}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Escritório + Central de ajuda */}
      <div className="px-3 pb-2 shrink-0 space-y-2">
        <div className="rounded-lg border border-navy-800 bg-navy-900 p-3">
          <div className="text-[10px] uppercase tracking-widest text-white/40">ESCRITÓRIO</div>
          <div className="text-sm font-medium truncate">{escritorioNome}</div>
        </div>
        <Link
          href="/ajuda"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
        >
          <HelpCircle className="h-4 w-4 text-white/60" />
          <span>Central de ajuda</span>
        </Link>
      </div>

      {/* Perfil */}
      <div className="border-t border-navy-800 px-3 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-brand-500 text-white flex items-center justify-center shrink-0">
            <span className="text-sm font-bold">{userName?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{userName}</div>
            <div className="text-[11px] text-white/50 truncate">{userEmail}</div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/notificacoes"
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-white/10"
              title="Notificações"
            >
              <Bell className="h-4 w-4 text-white/60" />
            </Link>
            <Link
              href="/configuracoes"
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-white/10"
              title="Configurações"
            >
              <Settings className="h-4 w-4 text-white/60" />
            </Link>
            <button
              onClick={() => {
                import('next-auth/react').then(({ signOut }) =>
                  signOut({ callbackUrl: '/login' })
                )
              }}
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-red-500/20"
              title="Sair"
            >
              <LogOut className="h-4 w-4 text-red-300" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
