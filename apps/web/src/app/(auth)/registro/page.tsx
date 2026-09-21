'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Scale, Building2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegistroPage() {
  const router = useRouter()

  // Dados do escritório
  const [escritorioNome, setEscritorioNome] = useState('')
  const [escritorioCnpj, setEscritorioCnpj] = useState('')

  // Dados do usuário admin
  const [usuarioNome, setUsuarioNome] = useState('')
  const [usuarioEmail, setUsuarioEmail] = useState('')
  const [usuarioSenha, setUsuarioSenha] = useState('')
  const [usuarioConfirmaSenha, setUsuarioConfirmaSenha] = useState('')

  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validações
    if (usuarioSenha !== usuarioConfirmaSenha) {
      setError('As senhas não conferem')
      setIsLoading(false)
      return
    }

    if (usuarioSenha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setIsLoading(false)
      return
    }

    try {
      // Criar escritório e usuário
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escritorio: {
            nome: escritorioNome,
            cnpj: escritorioCnpj || null,
          },
          usuario: {
            nome: usuarioNome,
            email: usuarioEmail,
            senha: usuarioSenha,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao criar conta')
        setIsLoading(false)
        return
      }

      // Login automático após registro
      const signInResult = await signIn('credentials', {
        email: usuarioEmail,
        password: usuarioSenha,
        redirect: false,
      })

      if (signInResult?.error) {
        // Redirecionar para login se login automático falhar
        router.push('/login?registered=true')
      } else {
        router.push('/painel')
        router.refresh()
      }
    } catch {
      setError('Erro ao criar conta. Tente novamente.')
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
        <CardTitle className="text-2xl text-center">Criar conta</CardTitle>
        <CardDescription className="text-center">
          Cadastre seu escritório e comece a usar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Dados do Escritório */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Dados do Escritório
            </div>

            <div className="space-y-2">
              <Label htmlFor="escritorioNome">Nome do escritório *</Label>
              <Input
                id="escritorioNome"
                type="text"
                placeholder="Nome da sua empresa"
                value={escritorioNome}
                onChange={(e) => setEscritorioNome(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="escritorioCnpj">CNPJ (opcional)</Label>
              <Input
                id="escritorioCnpj"
                type="text"
                placeholder="00.000.000/0000-00"
                value={escritorioCnpj}
                onChange={(e) => setEscritorioCnpj(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Administrador
              </span>
            </div>
          </div>

          {/* Dados do Admin */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              Dados do Administrador
            </div>

            <div className="space-y-2">
              <Label htmlFor="usuarioNome">Seu nome completo *</Label>
              <Input
                id="usuarioNome"
                type="text"
                placeholder="Seu nome"
                value={usuarioNome}
                onChange={(e) => setUsuarioNome(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usuarioEmail">Email *</Label>
              <Input
                id="usuarioEmail"
                type="email"
                placeholder="seu@email.com"
                value={usuarioEmail}
                onChange={(e) => setUsuarioEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usuarioSenha">Senha *</Label>
                <div className="relative">
                  <Input
                    id="usuarioSenha"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••"
                    value={usuarioSenha}
                    onChange={(e) => setUsuarioSenha(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
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

              <div className="space-y-2">
                <Label htmlFor="usuarioConfirmaSenha">Confirmar *</Label>
                <Input
                  id="usuarioConfirmaSenha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••"
                  value={usuarioConfirmaSenha}
                  onChange={(e) => setUsuarioConfirmaSenha(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar conta'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">
            Já tem uma conta?{' '}
          </span>
          <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">
            Entrar
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Ao criar uma conta, você concorda com nossos{' '}
          <Link href="/termos" className="underline hover:text-foreground">
            Termos de Uso
          </Link>{' '}
          e{' '}
          <Link href="/privacidade" className="underline hover:text-foreground">
            Política de Privacidade
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
