'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 as Spinner } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/painel'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [escritorio, setEscritorio] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // O next-auth v4 devolve o erro de authorize() como "Error: <mensagem>" no
  // query param `error`. Limpa o prefixo e traduz os códigos genéricos.
  function traduzirErro(bruto: string): string {
    const limpo = bruto.replace(/^Error:\s*/, '').trim()
    if (!limpo) return 'Não foi possível entrar. Tente novamente.'
    if (limpo === 'CredentialsSignin' || limpo === 'OAuthSignin') {
      return 'Email ou senha incorretos.'
    }
    if (limpo === 'OAuthAccountNotLinked') {
      return 'Esta conta usa outro método de entrada.'
    }
    return limpo
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        escritorio,
        redirect: false,
      })

      if (result?.error) {
        setError(traduzirErro(result.error))
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-brand-100 dark:bg-brand-900/30">
            <Scale className="h-8 w-8 text-brand-600" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Entrar</CardTitle>
        <CardDescription className="text-center">
          Acesse sua conta para continuar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Entrar num escritório específico
            </summary>
            <div className="mt-3 space-y-2">
              <Label htmlFor="escritorio">CNPJ do escritório</Label>
              <Input
                id="escritorio"
                type="text"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                value={escritorio}
                onChange={(e) => setEscritorio(e.target.value)}
                autoComplete="off"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Só é necessário se o mesmo email existir em mais de um escritório.
              </p>
            </div>
          </details>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">
            Não tem uma conta?{' '}
          </span>
          <Link href="/registro" className="text-brand-600 hover:text-brand-700 font-medium">
            Criar conta
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function LoginFormFallback() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-brand-100 dark:bg-brand-900/30">
            <Scale className="h-8 w-8 text-brand-600" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Entrar</CardTitle>
        <CardDescription className="text-center">
          Carregando...
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  )
}
