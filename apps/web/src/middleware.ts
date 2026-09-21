export { default } from 'next-auth/middleware'

export const config = {
  // Rotas protegidas - apenas usuários autenticados
  matcher: [
    '/painel/:path*',
    '/processos/:path*',
    '/clientes/:path*',
    '/demandas/:path*',
    '/agenda/:path*',
    '/financeiro/:path*',
    '/equipe/:path*',
    '/configuracoes/:path*',
    '/revisional/:path*',
    // Rotas que existiam fora do matcher — a página já checava a sessão,
    // mas o middleware é a camada que evita depender disso.
    '/publicacoes/:path*',
    '/integracoes/:path*',
    '/notificacoes/:path*',
    // Proteger raiz do dashboard
    '/painel',
    '/processos',
    '/clientes',
    '/demandas',
    '/agenda',
    '/financeiro',
    '/equipe',
    '/configuracoes',
    '/revisional',
    '/publicacoes',
    '/integracoes',
    '/notificacoes',
  ],
}
