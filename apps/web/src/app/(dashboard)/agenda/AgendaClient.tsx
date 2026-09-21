'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Calendar, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'

type Processo = { id: string; numeroCNJ: string; cliente?: { nome: string } }
type Audiencia = {
  id: string
  titulo: string
  tipo: string
  dataHora: string
  duracao: number
  local: string | null
  observacoes: string | null
  status: string
  processo: Processo | null
}
type Prazo = {
  id: string
  titulo: string
  tipo: string
  dataVencimento: string
  status: string
  processo: Processo | null
  diasRestantes: number
}

type Tab = 'audiencias' | 'prazos'

export function AgendaClient({
  initialAudiencias,
  initialPrazos,
  processos,
}: {
  initialAudiencias: Audiencia[]
  initialPrazos: Prazo[]
  processos: Processo[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('audiencias')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Audiencia | Prazo | null>(null)
  const [form, setForm] = useState<any>({})
  const [loading, setLoading] = useState(false)

  function openCreateAudiencia() {
    setEditing(null)
    setForm({
      titulo: '',
      tipo: 'AUDIENCIA',
      dataHora: '',
      duracao: 60,
      local: '',
      observacoes: '',
      status: 'AGENDADA',
      processoId: '',
    })
    setTab('audiencias')
    setShowModal(true)
  }

  function openCreatePrazo() {
    setEditing(null)
    setForm({
      titulo: '',
      tipo: 'PRAZO_PROCESSUAL',
      dataVencimento: '',
      status: 'PENDENTE',
      processoId: '',
    })
    setTab('prazos')
    setShowModal(true)
  }

  function openEditAudiencia(a: Audiencia) {
    setEditing(a)
    setForm({
      titulo: a.titulo,
      tipo: a.tipo,
      dataHora: a.dataHora.slice(0, 16),
      duracao: a.duracao,
      local: a.local || '',
      observacoes: a.observacoes || '',
      status: a.status,
      processoId: a.processo?.id || '',
    })
    setShowModal(true)
  }

  function openEditPrazo(p: Prazo) {
    setEditing(p)
    setForm({
      titulo: p.titulo,
      tipo: p.tipo,
      dataVencimento: p.dataVencimento.slice(0, 16),
      status: p.status,
      processoId: p.processo?.id || '',
    })
    setShowModal(true)
  }

  async function save() {
    if (!form.titulo.trim()) {
      toast.error('Título é obrigatório')
      return
    }
    setLoading(true)
    try {
      const isAudiencia = tab === 'audiencias'
      const payload = isAudiencia
        ? {
            ...form,
            dataHora: new Date(form.dataHora).toISOString(),
            duracao: Number(form.duracao),
            local: form.local || null,
            observacoes: form.observacoes || null,
            processoId: form.processoId || null,
          }
        : {
            ...form,
            dataVencimento: new Date(form.dataVencimento).toISOString(),
            processoId: form.processoId || null,
          }

      const base = isAudiencia ? 'audiencias' : 'prazos'
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/proxy/${base}/${editing.id}` : `/api/proxy/${base}`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Salvo!')
      setShowModal(false)
      router.refresh()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function remove(item: Audiencia | Prazo) {
    const base = 'dataHora' in item ? 'audiencias' : 'prazos'
    if (!confirm(`Excluir "${item.titulo}"?`)) return
    try {
      const res = await fetch(`/api/proxy/${base}/${item.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Excluído!')
      router.refresh()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    }
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        subtitle="Audiências e prazos"
        action={
          <div className="flex gap-2">
            <button
              onClick={openCreateAudiencia}
              className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 hover:bg-slate-50 dark:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Audiência
            </button>
            <button
              onClick={openCreatePrazo}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Prazo
            </button>
          </div>
        }
      />

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('audiencias')}
          className={`px-4 py-2 border-b-2 ${
            tab === 'audiencias'
              ? 'border-brand-600 text-brand-600 font-medium'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          Audiências ({initialAudiencias.length})
        </button>
        <button
          onClick={() => setTab('prazos')}
          className={`px-4 py-2 border-b-2 ${
            tab === 'prazos'
              ? 'border-brand-600 text-brand-600 font-medium'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          Prazos ({initialPrazos.length})
        </button>
      </div>

      {tab === 'audiencias' && (
        <div className="rounded-xl border bg-card overflow-hidden">
          {initialAudiencias.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Calendar className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Nenhuma audiência agendada</p>
            </div>
          ) : (
            <div className="divide-y">
              {initialAudiencias
                .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
                .map((a) => (
                  <div key={a.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{a.titulo}</h3>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span>📅 {fmtDate(a.dataHora)}</span>
                          <span>⏱️ {a.duracao} min</span>
                          {a.local && <span>📍 {a.local}</span>}
                          {a.processo && <span>📁 {a.processo.numeroCNJ}</span>}
                        </div>
                        {a.observacoes && (
                          <p className="mt-2 text-sm text-muted-foreground">{a.observacoes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditAudiencia(a)}
                          className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => remove(a)}
                          className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {tab === 'prazos' && (
        <div className="rounded-xl border bg-card overflow-hidden">
          {initialPrazos.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Nenhum prazo cadastrado</p>
            </div>
          ) : (
            <div className="divide-y">
              {initialPrazos
                .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime())
                .map((p) => {
                  const isUrgent = p.diasRestantes <= 3
                  const isPast = p.diasRestantes < 0
                  return (
                    <div
                      key={p.id}
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
                        isPast ? 'bg-red-50 dark:bg-red-900/10' : isUrgent ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{p.titulo}</h3>
                            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs">
                              {p.tipo.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span>📅 {fmtDate(p.dataVencimento)}</span>
                            {p.processo && <span>📁 {p.processo.numeroCNJ}</span>}
                            <span
                              className={`font-medium ${
                                isPast
                                  ? 'text-red-600'
                                  : isUrgent
                                    ? 'text-yellow-600'
                                    : 'text-muted-foreground'
                              }`}
                            >
                              {isPast
                                ? `⚠️ Vencido há ${Math.abs(p.diasRestantes)} dia(s)`
                                : `⏳ ${p.diasRestantes} dia(s) restantes`}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditPrazo(p)}
                            className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => remove(p)}
                            className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white dark:bg-slate-900 shadow-xl">
            <div className="border-b p-6">
              <h2 className="text-xl font-semibold">
                {editing ? 'Editar' : 'Novo'} {tab === 'audiencias' ? 'Audiência' : 'Prazo'}
              </h2>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input
                  type="text"
                  value={form.titulo || ''}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                />
              </div>
              {tab === 'audiencias' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Data e Hora</label>
                      <input
                        type="datetime-local"
                        value={form.dataHora || ''}
                        onChange={(e) => setForm({ ...form, dataHora: e.target.value })}
                        className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Duração (min)</label>
                      <input
                        type="number"
                        value={form.duracao || 60}
                        onChange={(e) => setForm({ ...form, duracao: e.target.value })}
                        className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Local</label>
                    <input
                      type="text"
                      value={form.local || ''}
                      onChange={(e) => setForm({ ...form, local: e.target.value })}
                      className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Observações</label>
                    <textarea
                      rows={3}
                      value={form.observacoes || ''}
                      onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                      className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">Data de Vencimento</label>
                  <input
                    type="datetime-local"
                    value={form.dataVencimento || ''}
                    onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Processo</label>
                <select
                  value={form.processoId || ''}
                  onChange={(e) => setForm({ ...form, processoId: e.target.value })}
                  className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                >
                  <option value="">— Nenhum —</option>
                  {processos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.numeroCNJ}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t p-4">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={loading}
                className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
