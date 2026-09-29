import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string
    role: string
    function: string
    escritorioId: string
    escritorioNome: string
    avatar: string | null
  }

  interface Session {
    user: User
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    function: string
    escritorioId: string
    escritorioNome: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'seu@email.com' },
        password: { label: 'Senha', type: 'password' },
        escritorio: { label: 'Escritório (CNPJ)', type: 'text', placeholder: 'opcional' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase()
        const senha = credentials?.password
        const cnpj = credentials?.escritorio?.trim()

        if (!email || !senha) {
          throw new Error('Email e senha são obrigatórios')
        }

        // O schema permite @@unique([email, escritorioId]) — o mesmo email pode
        // existir em vários escritórios. Buscamos todos os candidatos e validamos
        // a senha contra cada um, em vez de pegar o primeiro (findFirst) e arriscar
        // entrar na conta errada.
        const candidatos = await prisma.usuario.findMany({
          where: {
            email,
            ativo: true,
            escritorio: cnpj
              ? { cnpj: { contains: cnpj.replace(/\D/g, ''), mode: 'insensitive' as const } }
              : undefined,
          },
          include: {
            escritorio: {
              select: {
                id: true,
                nome: true,
                ativo: true,
              },
            },
          },
        })

        if (candidatos.length === 0) {
          throw new Error('Email ou senha incorretos')
        }

        const validos: typeof candidatos = []
        for (const candidato of candidatos) {
          if (await bcrypt.compare(senha, candidato.senhaHash)) {
            validos.push(candidato)
          }
        }

        if (validos.length === 0) {
          throw new Error('Email ou senha incorretos')
        }

        if (validos.length > 1) {
          throw new Error(
            'Este email está registado em mais de um escritório. Informe o CNPJ do escritório para entrar.'
          )
        }

        const user = validos[0]

        // Verificado só depois da senha, para não revelar que a conta existe.
        if (!user.escritorio.ativo) {
          throw new Error('Escritório desativado. Contate o suporte.')
        }

        // Atualizar último login
        await prisma.usuario.update({
          where: { id: user.id },
          data: { ultimoLogin: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          role: user.perfil,
          function: user.funcao,
          escritorioId: user.escritorioId,
          escritorioNome: user.escritorio.nome,
          avatar: user.avatar,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.function = user.function
        token.escritorioId = user.escritorioId
        token.escritorioNome = user.escritorioNome
        token.accessToken = (user as any).accessToken
      }

      // Atualizar sessão se necessário (ex: após update de perfil)
      if (trigger === 'update' && token.id) {
        const updatedUser = await prisma.usuario.findUnique({
          where: { id: token.id as string },
          include: { escritorio: { select: { nome: true } } },
        })
        if (updatedUser) {
          token.name = updatedUser.nome
          token.email = updatedUser.email
          token.avatar = updatedUser.avatar
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.function = token.function as string
        session.user.escritorioId = token.escritorioId as string
        session.user.escritorioNome = token.escritorioNome as string
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === 'development',
}
