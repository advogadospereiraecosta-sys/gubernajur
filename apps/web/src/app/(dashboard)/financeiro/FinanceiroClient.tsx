'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'

type Cliente = { id: string; nome: string }
type Lancamento = {
  id: string
  descricao: string
  tipo: 'RECEITA' | 'DESPESA'
  categoria: string
  valor: string
  dataVencimento: string
  dataPagamento: string | null
  status: string
  cliente: Cliente | null
}

const RECEITA_CATS = ['HONORARIOS', 'CUSTAS', 'SUCUMBENCIA', 'HONORARIOS_SUCUMBENCIAIS', 'ACORDO', 'OUTRA_RECEITA']
const DESPESA_CATS = ['SALARIO', 'ALUGUEL', 'CONDOMINIO', 'ENERGIA', 'AGUA', 'INTERNET', 'TELEFONE', 'MATERIAL_ESCRITORIO', 'COPIAS', 'CERTIDOES', 'PASSAGENS', 'HOSPEDAGEM', 'PUBLICACOES', 'SOFTWARE', 'ASSINATURAS', 'OUTRA_DESPESA']
const STATUS_OPTS = ['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO']

export function FinanceiroClient({
  initialLancamentos,
  clientes,
  initialResumo,
}: {
  initialLancamentos: Lancamento[]
  clientes: Cliente[]
  initialResumo: any
}) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Lancamento | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'RECEITA' | 'DESPESA'>('TODOS')
  const [form, setForm] = useState<any>({})
  const [loading, setLoading] = useState(false)

  function openCreate() {
    setEditing(null)
    setForm({
      descricao: '',
      tipo: 'RECEITA',
      categoria: 'HONORARIOS',
      valor: '',
      dataVencimento: new Date().toISOString().slice(0, 10),
      dataPagamento: '',
      status: 'PENDENTE',
      clienteId: '',
    })
    setShowModal(true)
  }

  function openEdit(l: Lancamento) {
    setEditing(l)
    setForm({
      descricao: l.descricao,
      tipo: l.tipo,
      categoria: l.categoria,
      valor: l.valor,
      dataVencimento: l.dataVencimento.slice(0, 10),
      dataPagamento: l.dataPagamento ? l.dataPagamento.slice(0, 10) : '',
      status: l.status,
      clienteId: l.cliente?.id || '',
    })
    setShowModal(true)
  }

  async function save() {
    if (!form.descricao.trim() || !form.valor) {
      toast.error('Preencha descrição e valor')
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        valor: parseFloat(form.valor).toFixed(2),
        dataVencimento: new Date(form.dataVencimento).toISOString(),
        dataPagamento: form.dataPagamento ? new Date(form.dataPagamento).toISOString() : null,
        clienteId: form.clienteId || null,
      }
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/proxy/financeiro/${editing.id}` : '/api/proxy/financeiro'
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

  async function remove(l: Lancamento) {
    if (!confirm(`Excluir "${l.descricao}"?`)) return
    try {
      const res = await fetch(`/api/proxy/financeiro/${l.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Excluído!')
      router.refresh()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    }
  }

  async function marcarPago(l: Lancamento) {
    try {
      const res = await fetch(`/api/proxy/financeiro/${l.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAGO', dataPagamento: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Marcado como pago!')
      router.refresh()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    }
  }

  const cats = form.tipo === 'RECEITA' ? RECEITA_CATS : DESPESA_CATS

  const resumo = useMemo(() => {
    const receitas = initialLancamentos.filter((l) => l.tipo === 'RECEITA' && l.status === 'PAGO')
    const despesas = initialLancamentos.filter((l) => l.tipo === 'DESPESA' && l.status === 'PAGO')
    const aReceber = initialLancamentos.filter((l) => l.tipo === 'RECEITA' && l.status === 'PENDENTE')
    const aPagar = initialLancamentos.filter((l) => l.tipo === 'DESPESA' && l.status === 'PENDENTE')

    const totalReceitas = receitas.reduce((s, l) => s + Number(l.valor), 0)
    const totalDespesas = despesas.reduce((s, l) => s + Number(l.valor), 0)
    const totalAReceber = aReceber.reduce((s, l) => s + Number(l.valor), 0)
    const totalAPagar = aPagar.reduce((s, l) => s + Number(l.valor), 0)

    return {
      receitas: totalReceitas,
      despesas: totalDespesas,
      saldo: totalReceitas - totalDespesas,
      aReceber: totalAReceber,
      aPagar: totalAPagar,
    }
  }, [initialLancamentos])

  const filtered = filtroTipo === 'TODOS'
    ? initialLancamentos
    : initialLancamentos.filter((l) => l.tipo === filtroTipo)

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        subtitle="Receitas, despesas e fluxo de caixa"
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Novo Lançamento
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Receitas (pagas)</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{fmt(resumo.receitas)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-red-600">
            <TrendingDown className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Despesas (pagas)</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{fmt(resumo.despesas)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-blue-600">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">A receber</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{fmt(resumo.aReceber)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-slate-600">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Saldo</span>
          </div>
          <p className={`mt-2 text-2xl font-bold ${resumo.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {fmt(resumo.saldo)}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['TODOS', 'RECEITA', 'DESPESA'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFiltroTipo(t)}
            className={`rounded-lg px-4 py-2 text-sm ${
              filtroTipo === t
                ? 'bg-brand-600 text-white'
                : 'border hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {t === 'TODOS' ? 'Todos' : t === 'RECEITA' ? 'Receitas' : 'Despesas'}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12">
            <DollarSign className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhum lançamento</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b bg-slate-50 dark:bg-slate-800/50">
              <tr className="text-left text-sm text-muted-foreground">
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium">{l.descricao}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`rounded-full px-2 py-1 text-xs ${
                      l.tipo === 'RECEITA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {l.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{l.categoria.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-sm">{l.cliente?.nome || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(l.dataVencimento).toLocaleDateString('pt-BR')}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${
                    l.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {fmt(Number(l.valor))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${
                      l.status === 'PAGO' ? 'bg-green-100 text-green-700' :
                      l.status === 'VENCIDO' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {l.status !== 'PAGO' && (
                        <button
                          onClick={() => marcarPago(l)}
                          className="rounded p-1 text-green-600 hover:bg-green-50"
                          title="Marcar como pago"
                        >
                          ✓
                        </button>
                      )}
                      <button onClick={() => openEdit(l)} className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(l)}
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
          <div className="w-full max-w-xl rounded-xl bg-white dark:bg-slate-900 shadow-xl">
            <div className="border-b p-6">
              <h2 className="text-xl font-semibold">{editing ? 'Editar' : 'Novo'} Lançamento</h2>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium mb-1">Descrição *</label>
                <input
                  type="text"
                  value={form.descricao || ''}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select
                    value={form.tipo || 'RECEITA'}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value, categoria: e.target.value === 'RECEITA' ? 'HONORARIOS' : 'SALARIO' })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  >
                    <option value="RECEITA">Receita</option>
                    <option value="DESPESA">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <select
                    value={form.categoria || ''}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  >
                    {cats.map((c) => (
                      <option key={c} value={c}>
                        {c.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valor || ''}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vencimento</label>
                  <input
                    type="date"
                    value={form.dataVencimento || ''}
                    onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cliente</label>
                  <select
                    value={form.clienteId || ''}
                    onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  >
                    <option value="">— Nenhum —</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={form.status || 'PENDENTE'}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  >
                    {STATUS_OPTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
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
