import { Suspense } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { ClaudeClient } from './ClaudeClient'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function ClaudePage({
  searchParams,
}: {
  searchParams: { id?: string }
}) {
  const session = await getServerSession(authOptions)
  const escritorioId = session?.user.escritorioId
  let integration: any = null
  if (escritorioId) {
    integration = searchParams.id
      ? await prisma.integracao.findFirst({ where: { id: searchParams.id, escritorioId } }).catch(() => null)
      : await prisma.integracao.findFirst({
          where: { escritorioId, tipo: 'CLAUDE' },
          orderBy: { criadoEm: 'desc' },
        }).catch(() => null)
  }

  return (
    <>
      <PageHeader
        backHref="/integracoes"
        title="Claude (MCP)"
        subtitle="Conecte seu Claude ao Gubernajur via Model Context Protocol"
      />
      <Suspense fallback={<div className="text-slate-500 text-sm">Carregando…</div>}>
        <ClaudeClient
          integration={
            integration
              ? {
                  id: integration.id,
                  status: integration.status,
                  config: integration.config as any,
                  ultimaSincronizacao: integration.ultimaSincronizacao?.toISOString() ?? null,
                  criadoEm: integration.criadoEm.toISOString(),
                }
              : null
          }
          escritorioId={escritorioId ?? ''}
          userId={session?.user?.id ?? ''}
          userEmail={session?.user?.email ?? ''}
        />
      </Suspense>
    </>
  )
}
