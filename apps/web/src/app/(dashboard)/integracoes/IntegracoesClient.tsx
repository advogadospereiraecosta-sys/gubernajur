'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Calendar,
  Mail,
  MessageCircle,
  Scale,
  Database,
  BookOpen,
  PenTool,
  CheckCircle2,
  Plus,
  Power,
  Loader2,
} from 'lucide-react'
import { ativarIntegracaoServer, criarIntegracaoServer, desativarIntegracaoServer } from './actions'

type Ativa = {
  id: string
  tipo: string
  nome: string
  status: string
  config: any
  ultimaSincronizacao: string | null
  criadoEm: string
}

type Disponivel = {
  tipo: string
  descricao: string
  cor: string
  icone: string
}

type EmBreve = {
  tipo: string
  nome: string
  descricao: string
  icone: string
  cor: string
}

const ICONS: Record<string, any> = {
  Sparkles, Calendar, Mail, MessageCircle, Scale, Database, BookOpen, PenTool,
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function IntegracoesClient({
  initial,
}: {
  initial: { ativas: Ativa[]; disponiveis: Disponivel[]; emBreve: EmBreve[] }
}) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggleAtiva(a: Ativa) {
    setBusy(a.id)
    setError(null)
    try {
      await start(async () => {
        if (a.status === 'ATIVA') await desativarIntegracaoServer(a.id)
        else await ativarIntegracaoServer(a.id)
      })
      router.refresh()
    } catch (e: any) {
      setError(e.message ?? 'Erro')
    } finally {
      setBusy(null)
    }
  }

  async function conectar(d: Disponivel) {
    setBusy(d.tipo)
    setError(null)
    try {
      await start(async () => {
        await criarIntegracaoServer({ tipo: d.tipo, nome: nomePadrao(d.tipo), config: configPadrao(d.tipo) })
      })
      router.refresh()
    } catch (e: any) {
      setError(e.message ?? 'Erro')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {initial.ativas.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Conectadas
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {initial.ativas.map((a) => (
              <CardAtiva key={a.id} a={a} busy={busy === a.id} onToggle={() => toggleAtiva(a)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Disponíveis
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initial.disponiveis.map((d) => {
            const Icon = ICONS[d.icone] ?? Scale
            return (
              <button
                key={d.tipo}
                onClick={() => conectar(d)}
                disabled={busy === d.tipo || isPending}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow disabled:opacity-60"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: d.cor + '15', color: d.cor }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex h-8 items-center gap-1 rounded-full bg-slate-900 px-3 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                    {busy === d.tipo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    Conectar
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-900">{nomePadrao(d.tipo)}</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{d.descricao}</p>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Em breve
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initial.emBreve.map((d) => {
            const Icon = ICONS[d.icone] ?? BookOpen
            return (
              <div
                key={d.tipo}
                className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-lg opacity-60"
                    style={{ backgroundColor: d.cor + '15', color: d.cor }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    Em breve
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-700">{d.nome}</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{d.descricao}</p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function CardAtiva({ a, busy, onToggle }: { a: Ativa; busy: boolean; onToggle: () => void }) {
  const Icon = ICONS[iconFor(a.tipo)] ?? Scale
  const cor = corFor(a.tipo)
  const link = linkFor(a.tipo, a.id)
  return (
    <div className="flex flex-col rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: cor + '15', color: cor }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          <CheckCircle2 className="h-3 w-3" /> Ativa
        </span>
      </div>
      <div className="text-sm font-semibold text-slate-900">{a.nome}</div>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{descricaoFor(a.tipo)}</p>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-[11px] text-slate-400">
          Sincronizada em {fmt(a.ultimaSincronizacao)}
        </span>
        <div className="flex gap-2">
          {link && (
            <Link
              href={link}
              className="inline-flex h-7 items-center rounded-md bg-slate-900 px-2.5 text-xs font-medium text-white hover:bg-slate-800"
            >
              Abrir
            </Link>
          )}
          <button
            onClick={onToggle}
            disabled={busy}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
            Desativar
          </button>
        </div>
      </div>
    </div>
  )
}

function nomePadrao(tipo: string) {
  return {
    CLAUDE: 'Claude (MCP)',
    GOOGLE_CALENDAR: 'Google Calendar',
    EMAIL: 'E-mail',
    WHATSAPP: 'WhatsApp',
    TJRN: 'TJRN',
    TJSP: 'TJSP',
    TJMG: 'TJMG',
    TJRJ: 'TJRJ',
    TJPB: 'TJPB',
    DATAJUD: 'DataJud (CNJ)',
  }[tipo] ?? tipo
}

function descricaoFor(tipo: string) {
  return {
    CLAUDE: 'Conectado via MCP. Pergunte no Claude sobre prazos, publicações e clientes.',
    GOOGLE_CALENDAR: 'Sincronize audiências e prazos com seu calendário.',
    EMAIL: 'Receba publicações e atualizações por e-mail.',
    WHATSAPP: 'Notificações de prazos urgentes no WhatsApp.',
    TJRN: 'Consulta processual no Tribunal de Justiça do RN.',
    TJSP: 'Consulta processual no Tribunal de Justiça de SP.',
    TJMG: 'Consulta processual no Tribunal de Justiça de MG.',
    TJRJ: 'Consulta processual no Tribunal de Justiça do RJ.',
    TJPB: 'Consulta processual no Tribunal de Justiça da PB.',
    DATAJUD: 'Consulta unificada via DataJud (CNJ).',
  }[tipo] ?? 'Integração ativa.'
}

function iconFor(tipo: string) {
  return {
    CLAUDE: 'Sparkles',
    GOOGLE_CALENDAR: 'Calendar',
    EMAIL: 'Mail',
    WHATSAPP: 'MessageCircle',
    TJRN: 'Scale',
    TJSP: 'Scale',
    TJMG: 'Scale',
    TJRJ: 'Scale',
    TJPB: 'Scale',
    DATAJUD: 'Database',
  }[tipo] ?? 'Scale'
}

function corFor(tipo: string) {
  return {
    CLAUDE: '#c96442',
    GOOGLE_CALENDAR: '#4285F4',
    EMAIL: '#0ea5e9',
    WHATSAPP: '#25D366',
    DATAJUD: '#0f172a',
    TJRN: '#0f172a',
    TJSP: '#0f172a',
    TJMG: '#0f172a',
    TJRJ: '#0f172a',
    TJPB: '#0f172a',
  }[tipo] ?? '#0f172a'
}

function linkFor(tipo: string, id: string) {
  if (tipo === 'CLAUDE') return `/integracoes/claude?id=${id}`
  return null
}

function configPadrao(tipo: string) {
  if (tipo === 'CLAUDE') return { url: 'http://localhost:3000/api/claude/mcp' }
  if (tipo === 'GOOGLE_CALENDAR') return { provider: 'google' }
  if (tipo === 'EMAIL') return { provider: 'smtp' }
  if (tipo === 'WHATSAPP') return { provider: 'wppconnect' }
  return {}
}
