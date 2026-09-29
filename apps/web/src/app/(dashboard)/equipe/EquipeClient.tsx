'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Mail, Phone, Shield, Plus, Pencil, UserMinus, UserCheck } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'

type Membro = {
  id: string
  nome: string
  email: string
  funcao: string
  perfil: string
  avatar: string | null
  ultimoLogin: string | null
}

const FUNCOES = [
  { valor: 'ADMIN', rotulo: 'Administrador' },
  { valor: 'ADVOGADO', rotulo: 'Advogado(a)' },
  { valor: 'ESTAGIARIO', rotulo: 'Estagiário(a)' },
  { valor: 'SECRETARIO', rotulo: 'Secretário(a)' },
  { valor: 'PARCEIRO', rotulo: 'Parceiro(a)' },
]

const PERFIS = [
  { valor: 'ADMIN', rotulo: 'Acesso total' },
  { valor: 'ADVOGADO', rotulo: 'Acesso aos módulos' },
  { valor: 'BASICO', rotulo: 'Acesso limitado' },
]

function rotulo(opcoes: { valor: string; rotulo: string }[], valor: string) {
  return opcoes.find((o) => o.valor === valor)?.rotulo ?? valor
}

function initials(nome: string) {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

function dataRelativa(iso: string | null) {
  if (!iso) return null
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'ontem'
  if (dias < 30) return `há ${dias} dias`
  return new Date(iso).toLocaleDateString('pt-BR')
}

const FORM_VAZIO = {
  nome: '',
  email: '',
  senha: '',
  telefone: '',
  funcao: 'ADVOGADO',
  perfil: 'BASICO',
}

export function EquipeClient({
  membros: initialMembros,
  podeGerenciar,
  meuId,
}: {
  membros: Membro[]
  podeGerenciar: boolean
  meuId: string
}) {
  const router = useRouter()
  const [membros, setMembros] = useState(initialMembros)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Membro | null>(null)
  const [form, setForm] = useState({ ...FORM_VAZIO })
  const [loading, setLoading] = useState(false)

  const filtered = membros.filter(
    (m) =>
      m.nome.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditing(null)
    setForm({ ...FORM_VAZIO })
    setShowModal(true)
  }

  async function openEdit(m: Membro) {
    setEditing(m)
    setForm({
      nome: m.nome,
      email: m.email,
      senha: '',
      telefone: '',
      funcao: m.funcao,
      perfil: m.perfil,
    })
    setShowModal(true)

    // findAll não devolve telefone — busca o registo completo
    try {
      const res = await fetch(`/api/proxy/usuarios/${m.id}`)
      if (res.ok) {
        const completo = await res.json()
        setForm((f) => ({ ...f, telefone: completo.telefone || '' }))
      }
    } catch {
      // telefone é opcional; segue sem ele
    }
  }

  async function save() {
    if (!form.nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (!editing) {
      if (!form.email.trim()) {
        toast.error('E-mail é obrigatório')
        return
      }
      if (form.senha.length < 6) {
        toast.error('A senha precisa de pelo menos 6 caracteres')
        return
      }
    }

    setLoading(true)
    try {
      if (editing) {
        const res = await fetch(`/api/proxy/usuarios/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: form.nome,
            email: form.email,
            telefone: form.telefone || null,
            funcao: form.funcao,
            perfil: form.perfil,
          }),
        })
        if (!res.ok) throw new Error(await res.text())
        toast.success('Membro actualizado!')
      } else {
        const res = await fetch('/api/proxy/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: form.nome,
            email: form.email,
            senha: form.senha,
            funcao: form.funcao,
          }),
        })
        if (!res.ok) throw new Error(await res.text())

        // create não aceita perfil — fica BASICO. Ajusta logo a seguir.
        const criado = await res.json()
        if (criado?.id && form.perfil !== 'BASICO') {
          const patch = await fetch(`/api/proxy/usuarios/${criado.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ perfil: form.perfil }),
          })
          if (!patch.ok) {
            toast.warning('Membro criado, mas o perfil não foi aplicado')
          }
        }
        toast.success('Membro convidado! Já pode iniciar sessão.')
      }

      setShowModal(false)
      router.refresh()
    } catch (e: any) {
      toast.error('Erro: ' + (e.message || 'falha ao guardar'))
    } finally {
      setLoading(false)
    }
  }

  async function desativar(m: Membro) {
    if (!confirm(`Desactivar ${m.nome}? A conta deixa de conseguir entrar.`)) return
    try {
      const res = await fetch(`/api/proxy/usuarios/${m.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Membro desactivado')
      setMembros((ms) => ms.filter((x) => x.id !== m.id))
      router.refresh()
    } catch (e: any) {
      toast.error('Erro: ' + (e.message || 'falha ao desactivar'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe"
        subtitle="Membros do escritório"
        action={
          podeGerenciar ? (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Convidar membro
            </button>
          ) : undefined
        }
      />

      {membros.length > 3 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-white px-4 py-2 dark:bg-slate-800"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Shield className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            {search ? 'Nenhum membro encontrado' : 'Nenhum membro cadastrado'}
          </p>
          {podeGerenciar && !search && (
            <button onClick={openCreate} className="mt-4 text-brand-600 hover:underline">
              Convidar o primeiro membro
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const ehVoce = m.id === meuId
            return (
              <div
                key={m.id}
                className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold dark:bg-brand-900/30">
                    {m.avatar ? (
                      <img
                        src={m.avatar}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      initials(m.nome)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">
                      {m.nome}
                      {ehVoce && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (você)
                        </span>
                      )}
                    </h3>
                    <p className="text-xs uppercase text-muted-foreground">
                      {rotulo(FUNCOES, m.funcao)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{m.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>
                      {m.ultimoLogin
                        ? `Último acesso: ${dataRelativa(m.ultimoLogin)}`
                        : 'Nunca acessou'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      m.perfil === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : m.perfil === 'ADVOGADO'
                          ? 'bg-brand-100 text-brand-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {rotulo(PERFIS, m.perfil)}
                  </span>

                  {podeGerenciar && !ehVoce && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(m)}
                        title="Editar membro"
                        className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => desativar(m)}
                        title="Desactivar membro"
                        className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {podeGerenciar && ehVoce && (
                    <span
                      title="A sua conta"
                      className="rounded p-1 text-muted-foreground"
                    >
                      <UserCheck className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="border-b p-6">
              <h2 className="text-xl font-semibold">
                {editing ? 'Editar Membro' : 'Convidar Membro'}
              </h2>
              {editing && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {editing.email}
                </p>
              )}
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  placeholder="Nome completo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                    placeholder="nome@escritorio.com.br"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Telefone</label>
                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {!editing && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Senha provisória
                  </label>
                  <input
                    type="text"
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                    placeholder="mínimo 6 caracteres"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Transmita esta senha ao membro. Ele não pode alterá-la sozinho.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Função</label>
                  <select
                    value={form.funcao}
                    onChange={(e) => setForm({ ...form, funcao: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  >
                    {FUNCOES.map((f) => (
                      <option key={f.valor} value={f.valor}>
                        {f.rotulo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Perfil de acesso</label>
                  <select
                    value={form.perfil}
                    onChange={(e) => setForm({ ...form, perfil: e.target.value })}
                    className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
                  >
                    {PERFIS.map((p) => (
                      <option key={p.valor} value={p.valor}>
                        {p.rotulo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t p-6">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={loading}
                className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? 'A guardar...' : editing ? 'Guardar' : 'Convidar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
