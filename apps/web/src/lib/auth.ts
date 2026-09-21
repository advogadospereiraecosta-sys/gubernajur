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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios')
        }

        const user = await prisma.usuario.findFirst({
          where: {
            email: credentials.email,
            ativo: true,
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

        if (!user) {
          throw new Error('Email ou senha incorretos')
        }

        if (!user.escritorio.ativo) {
          throw new Error('Escritório desativado. Contate o suporte.')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.senhaHash
        )

        if (!isPasswordValid) {
          throw new Error('Email ou senha incorretos')
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
