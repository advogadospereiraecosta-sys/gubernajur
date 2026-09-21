'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'

type Cliente = {
  id: string
  tipoPessoa: string
  nome: string
  cpfCnpj: string | null
  email: string | null
  telefone: string | null
  cidade: string | null
  estado: string | null
  createdAt: string
}

export function ClientesClient({ initialClientes }: { initialClientes: Cliente[] }) {
  const router = useRouter()
  const [clientes, setClientes] = useState(initialClientes)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [form, setForm] = useState({
    tipoPessoa: 'FISICA',
    nome: '',
    cpfCnpj: '',
    email: '',
    telefone: '',
    cidade: '',
    estado: '',
  })
  const [loading, setLoading] = useState(false)

  const filtered = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      (c.cpfCnpj || '').includes(search) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditing(null)
    setForm({ tipoPessoa: 'FISICA', nome: '', cpfCnpj: '', email: '', telefone: '', cidade: '', estado: '' })
    setShowModal(true)
  }

  function openEdit(c: Cliente) {
    setEditing(c)
    setForm({
      tipoPessoa: c.tipoPessoa,
      nome: c.nome,
      cpfCnpj: c.cpfCnpj || '',
      email: c.email || '',
      telefone: c.telefone || '',
      cidade: c.cidade || '',
      estado: c.estado || '',
    })
    setShowModal(true)
  }

  async function save() {
    if (!form.nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    setLoading(true)
    try {
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/proxy/clientes/${editing.id}` : '/api/proxy/clientes'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success(editing ? 'Cliente atualizado!' : 'Cliente criado!')
      setShowModal(false)
      router.refresh()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function remove(c: Cliente) {
    if (!confirm(`Excluir cliente "${c.nome}"?`)) return
    try {
      const res = await fetch(`/api/proxy/clientes/${c.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Cliente excluído!')
      setClientes((cs) => cs.filter((x) => x.id !== c.id))
      router.refresh()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        subtitle="Gerencie seus clientes"
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Novo Cliente
          </button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border bg-white pl-10 pr-4 py-2 dark:bg-slate-800"
        />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
            </p>
            {!search && (
              <button onClick={openCreate} className="mt-4 text-brand-600 hover:underline">
                Cadastrar primeiro cliente
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b bg-slate-50 dark:bg-slate-800/50">
              <tr className="text-left text-sm text-muted-foreground">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">CPF/CNPJ</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Cidade/UF</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium">{c.nome}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs">
                      {c.tipoPessoa === 'FISICA' ? 'PF' : 'PJ'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.cpfCnpj || '—'}</td>
                  <td className="px-4 py-3 text-sm">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-sm">{c.telefone || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {c.cidade ? `${c.cidade}/${c.estado}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(c)} className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
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
          <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-slate-900 shadow-xl">
            <div className="border-b p-6">
              <h2 className="text-xl font-semibold">
                {editing ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select
                    value={form.tipoPessoa}
                    onChange={(e) => setForm({ ...form, tipoPessoa: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  >
                    <option value="FISICA">Pessoa Física</option>
                    <option value="JURIDICA">Pessoa Jurídica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {form.tipoPessoa === 'FISICA' ? 'CPF' : 'CNPJ'}
                  </label>
                  <input
                    type="text"
                    value={form.cpfCnpj}
                    onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <input
                    type="text"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Cidade</label>
                  <input
                    type="text"
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border bg-white px-3 py-2 uppercase dark:bg-slate-800"
                  />
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
