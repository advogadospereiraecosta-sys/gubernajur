'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Eye, Newspaper } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'

type Publicacao = {
  id: string
  tribunal: string
  tipo: string
  conteudo: string
  dataPublicacao: string
  lida: boolean
  processoId: string
}

export function PublicacoesClient({ initialPublicacoes }: { initialPublicacoes: Publicacao[] }) {
  const router = useRouter()
  const [showAll, setShowAll] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function marcarLida(p: Publicacao) {
    try {
      const res = await fetch(`/api/proxy/publicacoes/${p.id}/ler`, { method: 'PATCH' })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Marcada como lida')
      router.refresh()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    }
  }

  const lista = showAll ? initialPublicacoes : initialPublicacoes.filter((p) => !p.lida)
  const naoLidas = initialPublicacoes.filter((p) => !p.lida).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publicações"
        subtitle="Diário de Justiça e movimentações processuais"
        action={
          <button
            onClick={() => setShowAll(!showAll)}
            className="rounded-lg border bg-white px-4 py-2 hover:bg-slate-50 dark:bg-slate-800"
          >
            {showAll ? 'Mostrar apenas não lidas' : 'Mostrar todas'}
          </button>
        }
      />

      {naoLidas > 0 && (
        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4">
          <p className="text-sm">
            📬 Você tem <strong>{naoLidas}</strong> publicação(ões) não lida(s)
          </p>
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        {lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Newspaper className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              {showAll ? 'Nenhuma publicação cadastrada' : 'Nenhuma publicação não lida 🎉'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {lista.map((p) => {
              const isExpanded = expanded === p.id
              return (
                <div
                  key={p.id}
                  className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
                    !p.lida ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!p.lida && (
                      <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{p.tipo}</span>
                        <span className="text-xs text-muted-foreground">
                          • {p.tribunal}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • {new Date(p.dataPublicacao).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p
                        className={`text-sm text-muted-foreground ${
                          isExpanded ? '' : 'line-clamp-2'
                        }`}
                      >
                        {p.conteudo}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => setExpanded(isExpanded ? null : p.id)}
                          className="text-xs text-brand-600 hover:underline"
                        >
                          {isExpanded ? 'Recolher' : 'Ver mais'}
                        </button>
                        {!p.lida && (
                          <button
                            onClick={() => marcarLida(p)}
                            className="flex items-center gap-1 text-xs text-green-600 hover:underline"
                          >
                            <CheckCircle className="h-3 w-3" /> Marcar como lida
                          </button>
                        )}
                      </div>
                    </div>
                    {!p.lida && <Eye className="h-4 w-4 text-blue-500" />}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
