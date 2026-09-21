import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RevisionalClient, type CasoResumo } from './RevisionalClient'

export const dynamic = 'force-dynamic'

export default async function RevisionalPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const escritorioId = session.user.escritorioId

  // Lê direto do Prisma: a API NestJS ainda não tem módulo de revisional, e
  // o app web já acessa o banco diretamente nas rotas do Claude e do MCP.
  const contratos = await prisma.contratoBancario.findMany({
    where: { escritorioId },
    include: {
      cliente: { select: { nome: true, cpfCnpj: true } },
      analises: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })

  const num = (v: unknown) => Number(v ?? 0)

  const casos: CasoResumo[] = contratos.map((c) => {
    const a = c.analises[0]
    return {
      protocolo: c.protocolo,
      cliente: c.cliente.nome,
      clienteCpf: c.cliente.cpfCnpj,
      banco: c.banco,
      veiculo: c.veiculoDescricao,
      dataContrato: c.dataContrato.toISOString(),
      valorFinanciado: num(c.valorFinanciado),
      parcelas: `${c.parcelasPagas}/${c.totalParcelas}`,
      taxaMensal: num(c.taxaJurosMensal),
      situacaoContrato: c.situacaoContrato,
      situacaoPagamento: c.situacaoPagamento,
      analise: a
        ? {
            em: a.createdAt.toISOString(),
            caminho: a.caminho,
            teses: a.teses,
            tesesDescartadas: a.tesesDescartadas as { tese: string; motivo: string }[],
            alertas: a.alertas,
            exigeDecisaoHumana: a.exigeDecisaoHumana,
            pedeTutela: a.pedeTutela,
            pedeGratuidade: a.pedeGratuidade,
            taxaMediaBacen: num(a.bacenTaxaMensal),
            bacenCompetencia: a.bacenCompetencia,
            bacenFonte: a.bacenFonte,
            prestacaoCobrada: num(a.prestacaoRecalculada),
            prestacaoCorreta: num(a.prestacaoCorreta),
            pagoAMaior: num(a.pagoAMaior),
            reducaoSaldo: num(a.reducaoSaldo),
            beneficioTotal: num(a.beneficioTotal),
            beneficioComExpurgo: a.beneficioComExpurgo ? num(a.beneficioComExpurgo) : null,
            linkAssinatura: a.autentiqueLink,
            assinadoEm: a.assinadoEm?.toISOString() ?? null,
          }
        : null,
    }
  })

  return <RevisionalClient casos={casos} />
}
