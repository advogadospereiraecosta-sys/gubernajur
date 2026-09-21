import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { escritorio, usuario } = body

    // Validação básica
    if (!escritorio?.nome || !usuario?.email || !usuario?.senha || !usuario?.nome) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Envia diretamente para a API sem usar axios (evita problemas de configuração)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

    const response = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: usuario.nome,
        email: usuario.email,
        senha: usuario.senha,
        nomeEscritorio: escritorio.nome,
        cnpj: escritorio.cnpj || undefined,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.error || 'Erro ao criar conta' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Erro interno ao criar conta' },
      { status: 500 }
    )
  }
}
