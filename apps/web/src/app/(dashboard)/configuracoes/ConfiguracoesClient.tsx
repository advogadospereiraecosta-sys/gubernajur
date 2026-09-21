'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Building, User } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'

type Escritorio = {
  id: string
  nome: string
  cnpj: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  plano: string
}
type Usuario = {
  id: string
  nome: string
  email: string
  telefone: string | null
  avatar: string | null
}

export function ConfiguracoesClient({
  escritorio,
  usuario,
}: {
  escritorio: Escritorio | null
  usuario: Usuario
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'escritorio' | 'perfil'>('escritorio')

  const [escritorioForm, setEscritorioForm] = useState({
    nome: escritorio?.nome || '',
    cnpj: escritorio?.cnpj || '',
    telefone: escritorio?.telefone || '',
    email: escritorio?.email || '',
    endereco: escritorio?.endereco || '',
  })

  const [perfilForm, setPerfilForm] = useState({
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone || '',
  })

  const [loading, setLoading] = useState(false)

  async function saveEscritorio() {
    setLoading(true)
    try {
      const res = await fetch(`/api/proxy/escritorios/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(escritorioForm),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Escritório atualizado!')
      router.refresh()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function savePerfil() {
    setLoading(true)
    try {
      const res = await fetch(`/api/proxy/usuarios/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(perfilForm),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Perfil atualizado!')
      router.refresh()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" subtitle="Gerencie o escritório e seu perfil" />

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('escritorio')}
          className={`px-4 py-2 border-b-2 flex items-center gap-2 ${
            tab === 'escritorio'
              ? 'border-brand-600 text-brand-600 font-medium'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          <Building className="h-4 w-4" /> Escritório
        </button>
        <button
          onClick={() => setTab('perfil')}
          className={`px-4 py-2 border-b-2 flex items-center gap-2 ${
            tab === 'perfil'
              ? 'border-brand-600 text-brand-600 font-medium'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          <User className="h-4 w-4" /> Meu Perfil
        </button>
      </div>

      {tab === 'escritorio' && escritorio && (
        <div className="rounded-xl border bg-card p-6 max-w-2xl space-y-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm">
            📋 Plano atual:{' '}
            <span className="font-semibold">{escritorio.plano}</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nome do escritório *</label>
            <input
              type="text"
              value={escritorioForm.nome}
              onChange={(e) => setEscritorioForm({ ...escritorioForm, nome: e.target.value })}
              className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">CNPJ</label>
              <input
                type="text"
                value={escritorioForm.cnpj}
                onChange={(e) => setEscritorioForm({ ...escritorioForm, cnpj: e.target.value })}
                className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <input
                type="text"
                value={escritorioForm.telefone}
                onChange={(e) => setEscritorioForm({ ...escritorioForm, telefone: e.target.value })}
                className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">E-mail</label>
            <input
              type="email"
              value={escritorioForm.email}
              onChange={(e) => setEscritorioForm({ ...escritorioForm, email: e.target.value })}
              className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Endereço</label>
            <textarea
              rows={2}
              value={escritorioForm.endereco}
              onChange={(e) => setEscritorioForm({ ...escritorioForm, endereco: e.target.value })}
              className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={saveEscritorio}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {tab === 'perfil' && (
        <div className="rounded-xl border bg-card p-6 max-w-2xl space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-xl dark:bg-brand-900/30">
              {usuario.nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
            </div>
            <div>
              <h3 className="font-medium">{usuario.nome}</h3>
              <p className="text-sm text-muted-foreground">{usuario.email}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nome *</label>
            <input
              type="text"
              value={perfilForm.nome}
              onChange={(e) => setPerfilForm({ ...perfilForm, nome: e.target.value })}
              className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">E-mail</label>
            <input
              type="email"
              value={perfilForm.email}
              onChange={(e) => setPerfilForm({ ...perfilForm, email: e.target.value })}
              className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <input
              type="text"
              value={perfilForm.telefone}
              onChange={(e) => setPerfilForm({ ...perfilForm, telefone: e.target.value })}
              className="w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={savePerfil}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
