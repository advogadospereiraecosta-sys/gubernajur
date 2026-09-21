import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const tokenCache = new Map<string, { token: string; expiresAt: number }>()

async function getBackendToken(userId: string, escritorioId: string, email: string) {
  const cached = tokenCache.get(userId)
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token

  const res = await fetch(`${API_URL}/api/auth/exchange-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, escritorioId, email }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Falha ao autenticar com backend')
  const { accessToken } = await res.json()
  tokenCache.set(userId, { token: accessToken, expiresAt: Date.now() + 50 * 60_000 })
  return accessToken
}

async function handle(req: NextRequest, { params }: { params: { path: string[] } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  }

  const token = await getBackendToken(
    session.user.id,
    session.user.escritorioId as string,
    session.user.email!
  )

  const url = `${API_URL}/api/${params.path.join('/')}`
  const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined

  const res = await fetch(url, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body,
  })

  const data = await res.text()
  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  })
}

export const GET = handle
export const POST = handle
export const PATCH = handle
export const PUT = handle
export const DELETE = handle
