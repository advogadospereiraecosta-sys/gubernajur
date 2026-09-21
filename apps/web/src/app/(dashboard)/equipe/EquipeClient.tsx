'use client'

import { Mail, Phone, Shield } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'

type Membro = {
  id: string
  nome: string
  email: string
  funcao: string
  perfil: string
  avatar: string | null
  telefone: string | null
  ativo: boolean
}

function initials(nome: string) {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export function EquipeClient({ membros }: { membros: Membro[] }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Equipe" subtitle="Membros do escritório" />

      {membros.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Nenhum membro cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {membros.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold dark:bg-brand-900/30">
                  {m.avatar ? (
                    <img src={m.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    initials(m.nome)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{m.nome}</h3>
                  <p className="text-xs text-muted-foreground uppercase">{m.funcao}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{m.email}</span>
                </div>
                {m.telefone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{m.telefone}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span className={`rounded-full px-2 py-1 text-xs ${
                  m.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {m.ativo ? 'Ativo' : 'Inativo'}
                </span>
                <span className="text-xs text-muted-foreground">{m.perfil}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
