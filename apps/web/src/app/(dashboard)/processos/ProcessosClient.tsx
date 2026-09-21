'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Search, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'

type Cliente = { id: string; nome: string }
type Processo = {
  id: string
  numeroCNJ: string
  cliente: Cliente
  classe: string
  area: string
  fase: string
  tribunal: string
  orgaoJulgador: string
  valorCausa: string | null
  dataAjuizamento: string
}

const AREAS = ['CIVEL', 'TRABALHISTA', 'CRIMINAL', 'TRIBUTARIO', 'PREVIDENCIARIO', 'FAMILIA', 'EMPRESARIAL']
const FASES = ['DISTRIBUIDO', 'CITACAO', 'INSTRUCAO', 'SENTENCA', 'RECURSO', 'TRANSITO', 'ARQUIVADO']

export function ProcessosClient({
  initialProcessos,
  clientes,
}: {
  initialProcessos: Processo[]
  clientes: Cliente[]
}) {
  const router = useRouter()
  const [processos] = useState(initialProcessos)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Processo | null>(null)
  const [form, setForm] = useState({
    numeroCNJ: '',
    clienteId: '',
    classe: '',
    area: 'CIVEL',
    fase: 'DISTRIBUIDO',
    tribunal: '',
    orgaoJulgador: '',
    valorCausa: '',
    dataAjuizamento: new Date().toISOString().slice(0, 10),
  })
  const [loading, setLoading] = useState(false)

  const filtered = processos.filter(
    (p) =>
      p.numeroCNJ.includes(search) ||
      p.cliente.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.classe.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditing(null)
    setForm({
      numeroCNJ: '',
      clienteId: clientes[0]?.id || '',
      classe: '',
      area: 'CIVEL',
      fase: 'DISTRIBUIDO',
      tribunal: '',
      orgaoJulgador: '',
      valorCausa: '',
      dataAjuizamento: new Date().toISOString().slice(0, 10),
    })
    setShowModal(true)
  }

  function openEdit(p: Processo) {
    setEditing(p)
    setForm({
      numeroCNJ: p.numeroCNJ,
      clienteId: p.cliente.id,
      classe: p.classe,
      area: p.area,
      fase: p.fase,
      tribunal: p.tribunal,
      orgaoJulgador: p.orgaoJulgador,
      valorCausa: p.valorCausa || '',
      dataAjuizamento: p.dataAjuizamento.slice(0, 10),
    })
    setShowModal(true)
  }

  async function save() {
    if (!form.numeroCNJ.trim() || !form.clienteId || !form.classe.trim()) {
      toast.error('Preencha os campos obrigatórios')
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        valorCausa: form.valorCausa ? parseFloat(form.valorCausa).toFixed(2) : null,
        dataAjuizamento: new Date(form.dataAjuizamento).toISOString(),
        dataDistribuicao: new Date(form.dataAjuizamento).toISOString(),
      }
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/proxy/processos/${editing.id}` : '/api/proxy/processos'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success(editing ? 'Processo atualizado!' : 'Processo criado!')
      setShowModal(false)
      router.refresh()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function remove(p: Processo) {
    if (!confirm(`Excluir processo ${p.numeroCNJ}?`)) return
    try {
      const res = await fetch(`/api/proxy/processos/${p.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Processo excluído!')
      router.refresh()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    }
  }

  function faseBadge(fase: string) {
    const colors: Record<string, string> = {
      DISTRIBUIDO: 'bg-blue-100 text-blue-700',
      CITACAO: 'bg-yellow-100 text-yellow-700',
      INSTRUCAO: 'bg-purple-100 text-purple-700',
      SENTENCA: 'bg-orange-100 text-orange-700',
      RECURSO: 'bg-red-100 text-red-700',
      TRANSITO: 'bg-green-100 text-green-700',
      ARQUIVADO: 'bg-slate-100 text-slate-700',
    }
    return colors[fase] || 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Processos"
        subtitle="Gerencie os processos do escritório"
        action={
          <button
            onClick={openCreate}
            disabled={clientes.length === 0}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Novo Processo
          </button>
        }
      />

      {clientes.length === 0 && (
        <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-4">
          <p className="text-sm">
            ⚠️ Você precisa cadastrar pelo menos um cliente antes de criar processos.{' '}
            <a href="/clientes" className="font-medium underline">
              Cadastrar cliente →
            </a>
          </p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por número CNJ, cliente ou classe..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border bg-white pl-10 pr-4 py-2 dark:bg-slate-800"
        />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              {search ? 'Nenhum processo encontrado' : 'Nenhum processo cadastrado ainda'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b bg-slate-50 dark:bg-slate-800/50">
              <tr className="text-left text-sm text-muted-foreground">
                <th className="px-4 py-3">Nº CNJ</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Classe</th>
                <th className="px-4 py-3">Área</th>
                <th className="px-4 py-3">Fase</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-mono text-xs">{p.numeroCNJ}</td>
                  <td className="px-4 py-3 font-medium">{p.cliente.nome}</td>
                  <td className="px-4 py-3 text-sm">{p.classe}</td>
                  <td className="px-4 py-3 text-sm">{p.area}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${faseBadge(p.fase)}`}>
                      {p.fase}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {p.valorCausa
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          Number(p.valorCausa)
                        )
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(p)}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-slate-900 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="border-b p-6">
              <h2 className="text-xl font-semibold">{editing ? 'Editar' : 'Novo'} Processo</h2>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nº CNJ *</label>
                  <input
                    type="text"
                    value={form.numeroCNJ}
                    onChange={(e) => setForm({ ...form, numeroCNJ: e.target.value })}
                    placeholder="0000000-00.0000.0.00.0000"
                    className="w-full rounded-lg border bg-white px-3 py-2 font-mono dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cliente *</label>
                <select
                  value={form.clienteId}
                  onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
                  className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                >
                  <option value="">Selecione...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Classe *</label>
                  <input
                    type="text"
                    value={form.classe}
                    onChange={(e) => setForm({ ...form, classe: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Área</label>
                  <select
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  >
                    {AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tribunal</label>
                  <input
                    type="text"
                    value={form.tribunal}
                    onChange={(e) => setForm({ ...form, tribunal: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Órgão Julgador</label>
                  <input
                    type="text"
                    value={form.orgaoJulgador}
                    onChange={(e) => setForm({ ...form, orgaoJulgador: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fase</label>
                  <select
                    value={form.fase}
                    onChange={(e) => setForm({ ...form, fase: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  >
                    {FASES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor da Causa (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valorCausa}
                    onChange={(e) => setForm({ ...form, valorCausa: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data de Ajuizamento</label>
                <input
                  type="date"
                  value={form.dataAjuizamento}
                  onChange={(e) => setForm({ ...form, dataAjuizamento: e.target.value })}
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
