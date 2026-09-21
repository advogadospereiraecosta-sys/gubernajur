import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac } from 'crypto'

/**
 * OAuth-style token exchange for the Claude MCP connector.
 *
 * POST application/x-www-form-urlencoded:
 *   grant_type=authorization_code
 *   code=<code from /api/claude/authorize>
 *   client_id=claude
 *   client_secret=<MCP_CLIENT_SECRET>
 *
 * Returns:
 *   { access_token, token_type: 'Bearer', expires_in: 86400, scope: 'mcp' }
 *
 * The JWT is self-signed with MCP_CLIENT_SECRET so the MCP route can verify it
 * without needing a database lookup on every request.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CODES = new Map<string, { escritorioId: string; userId: string; email: string; expiresAt: number }>()

// NOTE: this must mirror the in-memory map in /api/claude/authorize. In production
// we'd move both to Redis or a DB table.
;(globalThis as any).__gub_codes = (globalThis as any).__gub_codes ?? new Map<string, any>()
const CODES_REF = (globalThis as any).__gub_codes as Map<string, any>

setInterval(() => {
  const now = Date.now()
  for (const [k, v] of CODES_REF.entries()) if (v.expiresAt < now) CODES_REF.delete(k)
}, 5 * 60 * 1000)

const CLIENT_ID = 'claude'

function getSecret(): string {
  return process.env.MCP_CLIENT_SECRET || process.env.JWT_SECRET || 'dev-mcp-secret-change-me'
}

async function ensureIntegracao(escritorioId: string) {
  const ex = await prisma.integracao
    .findFirst({ where: { escritorioId, tipo: 'CLAUDE' } })
    .catch(() => null)
  if (ex) {
    return prisma.integracao
      .update({ where: { id: ex.id }, data: { status: 'ATIVA', ultimaSincronizacao: new Date() } })
      .catch(() => null)
  }
  return prisma.integracao
    .create({
      data: {
        escritorioId,
        tipo: 'CLAUDE',
        nome: 'Claude (MCP)',
        status: 'ATIVA',
        config: { url: 'http://localhost:3000/api/claude/mcp' },
        ultimaSincronizacao: new Date(),
      },
    })
    .catch(() => null)
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function signJwt(payload: Record<string, any>, ttlSec = 86400): string {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const body = { iat: now, exp: now + ttlSec, ...payload }
  const headerB = base64url(JSON.stringify(header))
  const bodyB = base64url(JSON.stringify(body))
  const sig = createHmac('sha256', getSecret()).update(`${headerB}.${bodyB}`).digest()
  return `${headerB}.${bodyB}.${base64url(sig)}`
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || ''
  let grant_type: string, code: string, client_id: string, client_secret: string
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await req.formData()
    grant_type = String(form.get('grant_type') ?? '')
    code = String(form.get('code') ?? '')
    client_id = String(form.get('client_id') ?? '')
    client_secret = String(form.get('client_secret') ?? '')
  } else if (contentType.includes('application/json')) {
    const json = await req.json().catch(() => ({}))
    grant_type = String(json.grant_type ?? '')
    code = String(json.code ?? '')
    client_id = String(json.client_id ?? '')
    client_secret = String(json.client_secret ?? '')
  } else {
    return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 })
  }

  if (grant_type !== 'authorization_code') {
    return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 })
  }
  if (client_id !== CLIENT_ID) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 })
  }
  if (client_secret !== getSecret()) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 })
  }
  if (!code) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'code is required' }, { status: 400 })
  }

  const entry = CODES_REF.get(code)
  if (!entry) {
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400 })
  }
  if (entry.expiresAt < Date.now()) {
    CODES_REF.delete(code)
    return NextResponse.json({ error: 'invalid_grant', error_description: 'code expired' }, { status: 400 })
  }

  CODES_REF.delete(code)

  // Optional: confirm integracao row exists
  await ensureIntegracao(entry.escritorioId)

  const access_token = signJwt({
    sub: entry.userId,
    email: entry.email,
    escritorioId: entry.escritorioId,
    scope: 'mcp',
  })

  return NextResponse.json({
    access_token,
    token_type: 'Bearer',
    expires_in: 86400,
    scope: 'mcp',
  })
}
