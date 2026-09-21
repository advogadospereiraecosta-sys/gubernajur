import { Suspense } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { IntegracoesClient } from './IntegracoesClient'
import { listIntegracoesServer } from './actions'

export default async function IntegracoesPage() {
  const data = await listIntegracoesServer().catch(() => ({ ativas: [], disponiveis: [], emBreve: [] }))
  return (
    <>
      <PageHeader
        title="Integrações"
        subtitle="Conecte o Gubernajur às ferramentas que você já usa"
      />
      <Suspense fallback={<div className="text-slate-500 text-sm">Carregando integrações…</div>}>
        <IntegracoesClient initial={data} />
      </Suspense>
    </>
  )
}
