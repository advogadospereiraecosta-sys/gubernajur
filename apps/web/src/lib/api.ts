import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Cache simples de tokens por sessão, para evitar trocas repetidas.
 * O token JWT do backend tem validade padrão do NestJS (1h).
 */
const tokenCache = new Map<string, { token: string; expiresAt: number }>()

async function getBackendToken(): Promise<string> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Não autenticado')

  const cacheKey = session.user.id
  const cached = tokenCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token
  }

  // Trocar sessão NextAuth por JWT do backend
  const res = await fetch(`${API_URL}/api/auth/exchange-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: session.user.id,
      escritorioId: session.user.escritorioId,
      email: session.user.email,
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Falha ao obter token do backend: ${res.status}`)
  }
  const { accessToken } = await res.json()

  // Cache por 50 minutos
  tokenCache.set(cacheKey, { token: accessToken, expiresAt: Date.now() + 50 * 60_000 })
  return accessToken
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const accessToken = await getBackendToken()
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    if (res.status === 401) return [] as any
    throw new Error(`API ${res.status}: ${await res.text().catch(() => '')}`)
  }
  return res.json()
}

export async function apiPost<T = any>(path: string, body: any): Promise<T> {
  const accessToken = await getBackendToken()
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text().catch(() => '')}`)
  return res.json()
}

export async function apiPatch<T = any>(path: string, body: any): Promise<T> {
  const accessToken = await getBackendToken()
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text().catch(() => '')}`)
  return res.json()
}

export async function apiDelete(path: string): Promise<void> {
  const accessToken = await getBackendToken()
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text().catch(() => '')}`)
}
