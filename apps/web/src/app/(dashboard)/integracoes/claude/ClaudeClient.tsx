'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Check,
  Copy,
  Loader2,
  ExternalLink,
  Plug,
  KeyRound,
  MessageSquareText,
  Zap,
  ShieldCheck,
  RefreshCcw,
} from 'lucide-react'
import { ativarIntegracaoServer, criarIntegracaoServer, desativarIntegracaoServer } from '../actions'

type Integration = {
  id: string
  status: string
  config: any
  ultimaSincronizacao: string | null
  criadoEm: string
}

const MCP_URL = 'http://localhost:3000/api/claude/mcp'
const AUTH_URL = 'http://localhost:3000/api/claude/authorize'

const PERGUNTAS = [
  'Quais prazos vencem essa semana?',
  'Tem publicação não triada pra mim?',
  'Quais demandas estão paradas há mais de 7 dias?',
  'Mostre os processos do cliente [nome].',
  'Como está o financeiro esse mês?',
  'Quais audiências estão marcadas para a próxima semana?',
]

export function ClaudeClient({
  integration,
  escritorioId,
  userId,
  userEmail,
}: {
  integration: Integration | null
  escritorioId: string
  userId: string
  userEmail: string
}) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [copied, setCopied] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const status = integration?.status ?? null
  const ativa = status === 'ATIVA'

  async function connect() {
    setBusy(true)
    setError(null)
    try {
      await start(async () => {
        await criarIntegracaoServer({ tipo: 'CLAUDE', nome: 'Claude (MCP)', config: { url: MCP_URL } })
      })
      router.refresh()
    } catch (e: any) {
      setError(e.message ?? 'Erro ao conectar')
    } finally {
      setBusy(false)
    }
  }

  async function toggle() {
    if (!integration) return
    setBusy(true)
    setError(null)
    try {
      await start(async () => {
        if (integration.status === 'ATIVA') await desativarIntegracaoServer(integration.id)
        else await ativarIntegracaoServer(integration.id)
      })
      router.refresh()
    } catch (e: any) {
      setError(e.message ?? 'Erro')
    } finally {
      setBusy(false)
    }
  }

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {/* Header card */}
      <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: '#c9644215', color: '#c96442' }}
        >
          <Sparkles className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Claude Sonnet · MCP</h2>
            {integration ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  ativa ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${ativa ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {ativa ? 'Conectada' : 'Inativa'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                Não conectada
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Conecte seu Claude (claude.ai ou desktop) ao Gubernajur. Ele passa a responder perguntas sobre
            prazos, publicações, processos, clientes, demandas, audiências e financeiro usando dados
            em tempo real.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {!integration ? (
            <button
              onClick={connect}
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
              Conectar
            </button>
          ) : (
            <button
              onClick={toggle}
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              {ativa ? 'Desativar' : 'Ativar'}
            </button>
          )}
        </div>
      </div>

      {/* 3 passos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Step
          n={1}
          icon={<ExternalLink className="h-4 w-4" />}
          title="Abra o Claude"
          desc="Em claude.ai → Settings → Connectors, ou no app desktop em Settings → Connectors."
        >
          <a
            href="https://claude.ai/settings/connectors"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800"
          >
            Abrir claude.ai <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Step>

        <Step
          n={2}
          icon={<KeyRound className="h-4 w-4" />}
          title="Adicione o conector MCP"
          desc="Clique em 'Add custom connector' e cole a URL abaixo."
        >
          <CopyField label="URL do MCP" value={MCP_URL} onCopy={copy} copied={copied === 'mcp'} />
        </Step>

        <Step
          n={3}
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Autorize o acesso"
          desc="Faça login com sua conta do Gubernajur para liberar os dados do seu escritório."
        >
          <a
            href={`${AUTH_URL}?escritorioId=${escritorioId}&userId=${userId}&email=${encodeURIComponent(userEmail)}&redirect_uri=${encodeURIComponent('https://claude.ai')}`}
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Autorizar agora
          </a>
        </Step>
      </div>

      {/* Capabilities */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Zap className="h-4 w-4 text-amber-500" /> O que o Claude pode responder
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            'Prazos vencendo nos próximos N dias',
            'Publicações não triadas',
            'Demandas paradas há mais de X dias',
            'Buscar cliente por nome',
            'Listar processos de um cliente',
            'Resumo financeiro do mês',
            'Audiências próximas',
          ].map((c) => (
            <div key={c} className="flex items-center gap-2 text-xs text-slate-700">
              <Check className="h-3.5 w-3.5 text-emerald-500" /> {c}
            </div>
          ))}
        </div>
      </div>

      {/* Perguntas */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MessageSquareText className="h-4 w-4 text-slate-500" /> Perguntas de exemplo
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PERGUNTAS.map((p) => (
            <button
              key={p}
              onClick={() => copy(p, p)}
              className="group flex items-start gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-left text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span className="mt-0.5 text-slate-400 group-hover:text-slate-700">›</span>
              <span className="flex-1">{p}</span>
              {copied === p ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-slate-500" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step({
  n,
  icon,
  title,
  desc,
  children,
}: {
  n: number
  icon: React.ReactNode
  title: string
  desc: string
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
          {n}
        </span>
        <span className="text-slate-500">{icon}</span>
      </div>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
      {children}
    </div>
  )
}

function CopyField({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string
  value: string
  onCopy: (v: string, k: string) => void
  copied: boolean
}) {
  return (
    <div className="mt-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
        <input
          readOnly
          value={value}
          onClick={(e) => e.currentTarget.select()}
          className="flex-1 bg-transparent text-[11px] font-mono text-slate-700 outline-none"
        />
        <button
          onClick={() => onCopy(value, label)}
          className="flex h-7 items-center gap-1 rounded-md bg-slate-900 px-2 text-[11px] font-medium text-white hover:bg-slate-800"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}
