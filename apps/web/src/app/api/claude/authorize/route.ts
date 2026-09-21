import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'

/**
 * Minimal OAuth-style authorize endpoint for the Claude MCP connector.
 *
 * - GET  → render a confirmation page with a "Authorize" form
 * - POST → validate session, generate a one-time code, redirect to redirect_uri
 *
 * The code is then exchanged at /api/claude/token for a JWT the MCP endpoint accepts.
 *
 * This is intentionally minimal — it's not full RFC 6749 OAuth 2.0, but enough
 * to integrate with claude.ai's connector flow which can accept a direct
 * authorize page. Production should use PKCE + Redis for code storage.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// In-memory code store: code → payload (10 min TTL)
const CODES = new Map<string, { escritorioId: string; userId: string; email: string; expiresAt: number }>()

// Sweep expired codes every 5 min
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of CODES.entries()) if (v.expiresAt < now) CODES.delete(k)
}, 5 * 60 * 1000)

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const escritorioId = req.nextUrl.searchParams.get('escritorioId') || session?.user?.escritorioId
  const userId = req.nextUrl.searchParams.get('userId') || session?.user?.id
  const email = req.nextUrl.searchParams.get('email') || session?.user?.email || ''
  const redirectUri = req.nextUrl.searchParams.get('redirect_uri') || 'https://claude.ai'
  const state = req.nextUrl.searchParams.get('state') || ''

  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  const html = `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Autorizar Claude · Gubernajur</title>
<style>
  :root { color-scheme: light dark; }
  body {
    font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
    background: #f8fafc; color: #0f172a;
    margin: 0; padding: 0; min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
  }
  .card {
    background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(15,23,42,0.08);
    padding: 32px; max-width: 420px; width: 100%; margin: 24px;
  }
  .logo { display:flex; align-items:center; gap:10px; margin-bottom: 24px; }
  .logo-1 { background:#c96442; color:white; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:700; }
  .logo-2 { font-weight:700; font-size: 18px; }
  h1 { font-size: 20px; margin: 0 0 8px; }
  p { font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 16px; }
  ul { font-size: 13px; color: #475569; padding-left: 18px; margin: 0 0 24px; }
  ul li { margin-bottom: 6px; }
  form { display:flex; flex-direction: column; gap: 10px; }
  button {
    background:#0f172a; color:white; border:none; padding:12px 16px; border-radius:10px;
    font-weight:600; font-size: 14px; cursor:pointer;
  }
  button.secondary { background:#f1f5f9; color:#0f172a; }
  button:hover { opacity:0.92; }
  .meta { font-size: 12px; color:#94a3b8; text-align: center; margin-top: 12px; }
</style>
</head><body>
  <div class="card">
    <div class="logo">
      <span class="logo-1">G</span>
      <span class="logo-2">Gubernajur</span>
    </div>
    <h1>Autorizar Claude (MCP)</h1>
    <p>Você está prestes a permitir que o <strong>Claude</strong> acesse dados do escritório <strong>${escapeHtml(session.user.escritorioNome ?? '')}</strong> via Model Context Protocol.</p>
    <ul>
      <li>Ler prazos, publicações, processos e clientes</li>
      <li>Consultar resumo financeiro e audiências</li>
      <li>Executar apenas leituras (somente tools listadas)</li>
    </ul>
    <form method="POST">
      <input type="hidden" name="escritorioId" value="${escapeHtml(escritorioId ?? '')}" />
      <input type="hidden" name="userId" value="${escapeHtml(userId ?? '')}" />
      <input type="hidden" name="email" value="${escapeHtml(email)}" />
      <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}" />
      <input type="hidden" name="state" value="${escapeHtml(state)}" />
      <button type="submit" name="action" value="approve">Autorizar e continuar</button>
      <button type="submit" name="action" value="cancel" class="secondary">Cancelar</button>
    </form>
    <div class="meta">Logado como ${escapeHtml(session.user.email ?? '')}</div>
  </div>
</body></html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const form = await req.formData()
  const action = form.get('action')
  const escritorioId = String(form.get('escritorioId') ?? session.user.escritorioId)
  const userId = String(form.get('userId') ?? session.user.id)
  const email = String(form.get('email') ?? session.user.email ?? '')
  const redirectUri = String(form.get('redirect_uri') ?? 'https://claude.ai')
  const state = String(form.get('state') ?? '')

  if (action !== 'approve') {
    return NextResponse.redirect(redirectUri + (state ? `?error=access_denied&state=${encodeURIComponent(state)}` : ''))
  }

  // Ensure the active integration row exists for this escritorio
  await ensureIntegracao(escritorioId)

  const code = randomUUID()
  CODES.set(code, {
    escritorioId,
    userId,
    email,
    expiresAt: Date.now() + 10 * 60 * 1000,
  })

  const url = new URL(redirectUri)
  url.searchParams.set('code', code)
  if (state) url.searchParams.set('state', state)
  return NextResponse.redirect(url.toString())
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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
