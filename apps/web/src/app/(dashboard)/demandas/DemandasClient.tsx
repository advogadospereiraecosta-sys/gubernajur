'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, CheckCircle, ListTodo } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'

type Processo = { id: string; numeroCNJ: string; cliente?: { nome: string } }
type Demanda = {
  id: string
  titulo: string
  descricao: string | null
  status: string
  prioridade: string
  prazo: string | null
  processo: Processo | null
  tags: string[]
  concluidaEm: string | null
}

const STATUS = ['A_FAZER', 'EM_ANDAMENTO', 'EM_REVISAO', 'CONCLUIDO', 'CANCELADO']
const PRIORIDADES = ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']

export function DemandasClient({
  initialDemandas,
  processos,
}: {
  initialDemandas: Demanda[]
  processos: Processo[]
}) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Demanda | null>(null)
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    status: 'A_FAZER',
    prioridade: 'NORMAL',
    processoId: '',
    prazo: '',
    tags: '',
  })
  const [loading, setLoading] = useState(false)

  function openCreate() {
    setEditing(null)
    setForm({
      titulo: '',
      descricao: '',
      status: 'A_FAZER',
      prioridade: 'NORMAL',
      processoId: '',
      prazo: '',
      tags: '',
    })
    setShowModal(true)
  }

  function openEdit(d: Demanda) {
    setEditing(d)
    setForm({
      titulo: d.titulo,
      descricao: d.descricao || '',
      status: d.status,
      prioridade: d.prioridade,
      processoId: d.processo?.id || '',
      prazo: d.prazo ? d.prazo.slice(0, 16) : '',
      tags: d.tags.join(', '),
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
      const payload = {
        ...form,
        processoId: form.processoId || null,
        prazo: form.prazo ? new Date(form.prazo).toISOString() : null,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      }
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/proxy/demandas/${editing.id}` : '/api/proxy/demandas'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success(editing ? 'Demanda atualizada!' : 'Demanda criada!')
      setShowModal(false)
      router.refresh()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function remove(d: Demanda) {
    if (!confirm(`Excluir demanda "${d.titulo}"?`)) return
    try {
      const res = await fetch(`/api/proxy/demandas/${d.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Demanda excluída!')
      router.refresh()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    }
  }

  async function conclude(d: Demanda) {
    try {
      const res = await fetch(`/api/proxy/demandas/${d.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONCLUIDO', concluidaEm: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Demanda concluída!')
      router.refresh()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    }
  }

  function statusBadge(s: string) {
    const map: Record<string, string> = {
      A_FAZER: 'bg-slate-100 text-slate-700',
      EM_ANDAMENTO: 'bg-blue-100 text-blue-700',
      EM_REVISAO: 'bg-yellow-100 text-yellow-700',
      CONCLUIDO: 'bg-green-100 text-green-700',
      CANCELADO: 'bg-red-100 text-red-700',
    }
    return map[s] || 'bg-slate-100 text-slate-700'
  }

  function prioridadeBadge(p: string) {
    const map: Record<string, string> = {
      BAIXA: 'text-slate-500',
      NORMAL: 'text-blue-600',
      ALTA: 'text-orange-600',
      URGENTE: 'text-red-600',
    }
    return map[p] || 'text-slate-500'
  }

  function statusLabel(s: string) {
    return s.replace(/_/g, ' ')
  }

  // Agrupa por status para visualização em colunas
  const porStatus = STATUS.reduce((acc, s) => {
    acc[s] = initialDemandas.filter((d) => d.status === s)
    return acc
  }, {} as Record<string, Demanda[]>)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demandas"
        subtitle="Tarefas e andamentos"
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Nova Demanda
          </button>
        }
      />

      {initialDemandas.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <ListTodo className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Nenhuma demanda cadastrada</p>
          <button onClick={openCreate} className="mt-4 text-brand-600 hover:underline">
            Criar primeira demanda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {STATUS.map((s) => (
            <div key={s} className="rounded-lg bg-slate-50 dark:bg-slate-800/30 p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {statusLabel(s)}
                </h3>
                <span className="rounded-full bg-white dark:bg-slate-900 px-2 py-0.5 text-xs font-semibold">
                  {porStatus[s].length}
                </span>
              </div>
              <div className="space-y-2">
                {porStatus[s].map((d) => (
                  <div
                    key={d.id}
                    className="rounded-lg border bg-white dark:bg-slate-900 p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h4 className="font-medium text-sm mb-1">{d.titulo}</h4>
                    {d.descricao && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{d.descricao}</p>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${prioridadeBadge(d.prioridade)}`}>
                        {d.prioridade}
                      </span>
                      {d.prazo && (
                        <span className="text-muted-foreground">
                          📅 {new Date(d.prazo).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                    {d.processo && (
                      <div className="mt-2 text-xs text-muted-foreground truncate">
                        📁 {d.processo.numeroCNJ}
                      </div>
                    )}
                    <div className="mt-2 flex gap-1 border-t pt-2">
                      {d.status !== 'CONCLUIDO' && (
                        <button
                          onClick={() => conclude(d)}
                          className="flex-1 rounded p-1 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          title="Concluir"
                        >
                          <CheckCircle className="inline h-3 w-3" /> Concluir
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(d)}
                        className="flex-1 rounded p-1 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Pencil className="inline h-3 w-3" /> Editar
                      </button>
                      <button
                        onClick={() => remove(d)}
                        className="flex-1 rounded p-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="inline h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {porStatus[s].length === 0 && (
                  <p className="text-xs text-center text-muted-foreground py-4">—</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white dark:bg-slate-900 shadow-xl">
            <div className="border-b p-6">
              <h2 className="text-xl font-semibold">{editing ? 'Editar' : 'Nova'} Demanda</h2>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  >
                    {STATUS.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prioridade</label>
                  <select
                    value={form.prioridade}
                    onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  >
                    {PRIORIDADES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Processo</label>
                <select
                  value={form.processoId}
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
              <div>
                <label className="block text-sm font-medium mb-1">Prazo</label>
                <input
                  type="datetime-local"
                  value={form.prazo}
                  onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                  className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="urgente, cliente VIP, audiência"
                  className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                />
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
