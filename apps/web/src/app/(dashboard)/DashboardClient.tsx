'use client'

import Link from 'next/link'
import { Briefcase, Users, Calendar, AlertTriangle, DollarSign, CheckCircle, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'

type Stats = {
  clientes: number
  processos: number
  audienciasProximas: number
  prazosUrgentes: number
  receitasMes: number
  despesasMes: number
  saldoMes: number
  demandasPendentes: number
  publicacoesNaoLidas: number
}

type AtividadeItem = {
  tipo: 'audiencia' | 'prazo' | 'demanda'
  titulo: string
  data: string
  urgente?: boolean
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function DashboardClient({ stats, proximas }: { stats: Stats; proximas: AtividadeItem[] }) {
  const cards = [
    { label: 'Clientes', value: stats.clientes, icon: Users, href: '/clientes', color: 'text-blue-600' },
    { label: 'Processos', value: stats.processos, icon: Briefcase, href: '/processos', color: 'text-purple-600' },
    { label: 'Audiências (próx. 7d)', value: stats.audienciasProximas, icon: Calendar, href: '/agenda', color: 'text-green-600' },
    { label: 'Prazos urgentes', value: stats.prazosUrgentes, icon: AlertTriangle, href: '/agenda', color: 'text-red-600' },
    { label: 'Demandas pendentes', value: stats.demandasPendentes, icon: CheckCircle, href: '/demandas', color: 'text-yellow-600' },
    { label: 'Publicações não lidas', value: stats.publicacoesNaoLidas, icon: TrendingUp, href: '/publicacoes', color: 'text-indigo-600' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Painel" subtitle="Visão geral do escritório" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Link
              key={c.label}
              href={c.href}
              className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
            >
              <Icon className={`h-5 w-5 ${c.color}`} />
              <p className="mt-2 text-2xl font-bold">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Próximas atividades
          </h2>
          {proximas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhuma atividade próxima
            </p>
          ) : (
            <div className="space-y-2">
              {proximas.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    a.urgente ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {a.tipo === 'audiencia' ? '⚖️' : a.tipo === 'prazo' ? '⏰' : '📋'}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{a.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.data).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  {a.urgente && (
                    <span className="rounded-full bg-red-100 text-red-700 px-2 py-1 text-xs">
                      Urgente
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Resumo Financeiro
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <span className="text-sm">Receitas do mês</span>
              <span className="font-semibold text-green-700">{fmt(stats.receitasMes)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <span className="text-sm">Despesas do mês</span>
              <span className="font-semibold text-red-700">{fmt(stats.despesasMes)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border-t-2">
              <span className="text-sm font-medium">Saldo</span>
              <span className={`font-bold ${stats.saldoMes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {fmt(stats.saldoMes)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
