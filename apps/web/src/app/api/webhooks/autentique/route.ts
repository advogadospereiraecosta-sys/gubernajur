/**
 * Webhook do Autentique.
 *
 * Duas decisões de segurança que valem explicar, porque a implementação
 * ingênua deste endpoint é perigosa:
 *
 * 1. **Falha fechada.** Se `AUTENTIQUE_WEBHOOK_SECRET` não estiver definido,
 *    o endpoint recusa. A versão que aceita tudo quando não há segredo deixa
 *    qualquer um marcar um contrato como assinado com um POST — basta
 *    descobrir a URL e um id de documento.
 *
 * 2. **O payload é só gatilho.** Nada é gravado a partir do corpo do POST: o
 *    estado vem de uma consulta à API do Autentique. Mesmo que a verificação
 *    de assinatura seja contornada, não há como forjar uma assinatura, porque
 *    a fonte da verdade é o Autentique, não quem chamou.
 *
 * O algoritmo do HMAC é uma suposição documentada (SHA-256 sobre o corpo cru,
 * hex). Confirme com o suporte do Autentique. Como a verdade vem da consulta,
 * um erro aqui custa uma atualização perdida, não um registro falso.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { consultarDocumento } from '@/lib/autentique'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function assinaturaValida(corpoCru: string, header: string | null): boolean {
  const segredo = process.env.AUTENTIQUE_WEBHOOK_SECRET
  if (!segredo) return false // falha fechada, de propósito
  if (!header) return false

  const esperado = crypto.createHmac('sha256', segredo).update(corpoCru).digest('hex')
  const a = Buffer.from(esperado)
  const b = Buffer.from(header)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/** Extrai o id do documento das formas de payload que o Autentique usa. */
function extrairDocumentId(payload: any): string | null {
  return (
    payload?.event?.data?.object?.id ??
    payload?.data?.object?.id ??
    payload?.document?.id ??
    payload?.id ??
    null
  )
}

export async function POST(req: NextRequest) {
  const corpoCru = await req.text()
  const header =
    req.headers.get('x-autentique-signature') ?? req.headers.get('x-hub-signature-256')

  if (!assinaturaValida(corpoCru, header)) {
    // Não diferencia "sem segredo" de "assinatura errada": quem chama de fora
    // não precisa saber qual dos dois foi.
    if (!process.env.AUTENTIQUE_WEBHOOK_SECRET) {
      console.error(
        '[autentique] AUTENTIQUE_WEBHOOK_SECRET ausente — webhook recusando tudo. ' +
          'Defina a variável para habilitar.'
      )
    }
    return new NextResponse('assinatura inválida', { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(corpoCru)
  } catch {
    return new NextResponse('payload inválido', { status: 400 })
  }

  const documentId = extrairDocumentId(payload)
  if (!documentId) return NextResponse.json({ ok: true, ignorado: 'sem id de documento' })

  const analise = await prisma.analiseRevisional.findFirst({
    where: { autentiqueDocumentoId: documentId },
    select: { id: true, assinadoEm: true },
  })
  if (!analise) {
    // Pode ser documento de outro produto do escritório. Não é erro.
    return NextResponse.json({ ok: true, ignorado: 'documento não pertence a um caso revisional' })
  }
  if (analise.assinadoEm) {
    return NextResponse.json({ ok: true, ignorado: 'já registrado como assinado' })
  }

  // A verdade vem da API, não do corpo do POST.
  let estado
  try {
    estado = await consultarDocumento(documentId)
  } catch (e) {
    console.error('[autentique] falha ao consultar documento', documentId, e)
    // 500 faz o Autentique reenviar depois — melhor que perder o evento.
    return new NextResponse('falha ao confirmar com a API', { status: 500 })
  }

  if (!estado) {
    return NextResponse.json({ ok: true, ignorado: 'documento não encontrado na API' })
  }

  if (estado.rejeitado) {
    await prisma.analiseRevisional.update({
      where: { id: analise.id },
      data: { alertas: { push: 'Assinatura recusada pelo cliente no Autentique.' } },
    })
    return NextResponse.json({ ok: true, estado: 'rejeitado' })
  }

  if (!estado.concluido) {
    return NextResponse.json({
      ok: true,
      estado: 'parcial',
      assinadas: estado.assinadas,
      total: estado.total,
    })
  }

  await prisma.analiseRevisional.update({
    where: { id: analise.id },
    data: { assinadoEm: estado.assinadoEm ? new Date(estado.assinadoEm) : new Date() },
  })

  return NextResponse.json({ ok: true, estado: 'assinado', em: estado.assinadoEm })
}
