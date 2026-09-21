/**
 * Ferramentas MCP do produto "Revisional de Financiamento de Veículo".
 *
 * Expostas ao Claude pelo servidor em /mcp, com os mesmos controles de
 * autenticação e isolamento por escritório das demais ferramentas.
 *
 * Divisão de responsabilidade:
 *   - o que é determinístico (Gate 1, taxa do Bacen, cálculo, escolha do
 *     caminho) roda aqui, em código;
 *   - o que é interpretativo (redigir, argumentar) fica com o Claude, que
 *     recebe a decisão pronta.
 */

import { prisma } from '@/lib/prisma'
import { prestacaoPrice, revisaoFinanciamento } from './calculo'
import { decidirCaminho, type Ficha } from './decisao'
import { montarInicial } from './montar-inicial'
import { INICIAL_MESTRE } from './inicial-mestre'
import { gerarDocumentosRevisional } from './gerar-documentos'
import { createContractDocument, consultarDocumento } from '@/lib/autentique'

// ── Taxa média do Bacen ────────────────────────────────────────────────────

const SERIE_BACEN = 25471 // PF — aquisição de veículos, recursos livres

export interface ConsultaBacen {
  serie: number
  competencia: string
  taxaMensal: number
  consultadoEm: string
  fonte: string
}

/**
 * Consulta a taxa média de mercado na API oficial do Banco Central, pela
 * competência do mês da contratação.
 *
 * A consulta é registrada com URL e horário para que a prova possa ser
 * refeita depois — é o que sustenta a tese dos juros em juízo.
 */
export async function consultarBacen(dataContrato: Date): Promise<ConsultaBacen> {
  const mes = String(dataContrato.getUTCMonth() + 1).padStart(2, '0')
  const ano = dataContrato.getUTCFullYear()
  const fonte =
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${SERIE_BACEN}/dados?formato=json` +
    `&dataInicial=01/${mes}/${ano}&dataFinal=28/${mes}/${ano}`

  const res = await fetch(fonte, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Bacen respondeu ${res.status}`)
  const dados = (await res.json()) as { data: string; valor: string }[]
  if (!dados?.length) {
    throw new Error(`Bacen não tem dado para a competência ${mes}/${ano}`)
  }

  return {
    serie: SERIE_BACEN,
    competencia: `${mes}/${ano}`,
    taxaMensal: parseFloat(dados[0].valor),
    consultadoEm: new Date().toISOString(),
    fonte,
  }
}

// ── Mapeamento Prisma ↔ domínio ────────────────────────────────────────────

const PARA_DOMINIO = {
  EM_CURSO: 'em_curso',
  QUITADO: 'quitado',
  EM_DIA: 'em_dia',
  ATRASADO: 'atrasado',
  NEGATIVADO: 'negativado',
  BUSCA_APREENSAO: 'busca_apreensao',
  BANCO: 'banco',
  LOJA: 'loja',
  NAO_SABE: 'nao_sabe',
  NAO_HOUVE: 'nao_houve',
} as const

const PARA_PRISMA: Record<string, string> = {
  A_revisional_repeticao: 'A_REVISIONAL_REPETICAO',
  B_revisional_tutela: 'B_REVISIONAL_TUTELA',
  C_revisional_consignacao: 'C_REVISIONAL_CONSIGNACAO',
  D_repeticao_pura: 'D_REPETICAO_PURA',
}

const n = (v: unknown) => Number(v ?? 0)

/** Monta a Ficha do domínio a partir dos registros do banco. */
function montarFicha(contrato: any): Ficha {
  const c = contrato
  return {
    protocolo: c.protocolo,
    criadoEm: c.createdAt.toISOString(),
    atendidoPor: '',
    cliente: {
      nome: c.cliente.nome,
      cpf: c.cliente.cpfCnpj ?? '',
      rg: c.cliente.rgIe ?? '',
      nacionalidade: c.cliente.nacionalidade ?? 'brasileira',
      estadoCivil: c.cliente.estadoCivil ?? '',
      profissao: c.cliente.profissao ?? '',
      dataNascimento: '',
      endereco: [c.cliente.endereco, c.cliente.bairro, c.cliente.cidade, c.cliente.estado]
        .filter(Boolean)
        .join(', '),
      cep: c.cliente.cep ?? undefined,
      telefone: c.cliente.celular ?? c.cliente.telefone ?? '',
      email: c.cliente.email ?? '',
      rendaFamiliar: c.cliente.rendaFamiliar ? n(c.cliente.rendaFamiliar) : undefined,
    },
    contrato: {
      banco: c.banco,
      numeroContrato: c.numeroContrato,
      dataContrato: c.dataContrato.toISOString().slice(0, 10),
      dataPrimeiroVencimento: c.dataPrimeiroVencimento?.toISOString().slice(0, 10),
      veiculoDescricao: c.veiculoDescricao,
      veiculoValorAVista: n(c.veiculoValorAVista),
      valorFinanciado: n(c.valorFinanciado),
      valorEntrada: n(c.valorEntrada),
      totalParcelas: c.totalParcelas,
      parcelasPagas: c.parcelasPagas,
      valorParcela: n(c.valorParcela),
      taxaJurosMensal: n(c.taxaJurosMensal),
      taxaJurosAnual: c.taxaJurosAnual ? n(c.taxaJurosAnual) : undefined,
      cetMensal: c.cetMensal ? n(c.cetMensal) : undefined,
      cetAnual: c.cetAnual ? n(c.cetAnual) : undefined,
      taxaMediaBacen: undefined, // preenchida na análise
      encargos: (c.encargos ?? []).map((e: any) => ({
        rubrica: e.rubrica,
        valor: n(e.valor),
        financiado: e.financiado,
      })),
      veiculoTrocaDescricao: c.veiculoTrocaDescricao ?? undefined,
      avaliacaoRealizadaPor: (PARA_DOMINIO as any)[c.avaliacaoRealizadaPor] ?? 'nao_sabe',
      recebeuLaudoAvaliacao: c.recebeuLaudoAvaliacao ?? undefined,
    },
    situacao: {
      situacaoContrato: (PARA_DOMINIO as any)[c.situacaoContrato],
      situacaoPagamento: (PARA_DOMINIO as any)[c.situacaoPagamento],
      parcelasEmAtraso: c.parcelasEmAtraso ?? undefined,
      querConsignar: c.querConsignar,
      objetivoBuscado: c.objetivoBuscado ?? '',
      relatoFatos: c.relatoFatos ?? '',
    },
    documentosEntregues: [],
  }
}

/** Gera o próximo protocolo do escritório: REV-AAAA-NNNN. */
async function proximoProtocolo(escritorioId: string): Promise<string> {
  const ano = new Date().getFullYear()
  const total = await prisma.contratoBancario.count({
    where: { escritorioId, protocolo: { startsWith: `REV-${ano}-` } },
  })
  return `REV-${ano}-${String(total + 1).padStart(4, '0')}`
}

// ── Ferramenta: abrir caso ─────────────────────────────────────────────────

async function toolCriarCaso(args: any, escritorioId: string) {
  const { clienteId, cpf } = args
  const cliente = clienteId
    ? await prisma.cliente.findFirst({ where: { id: clienteId, escritorioId } })
    : await prisma.cliente.findFirst({ where: { cpfCnpj: cpf, escritorioId } })

  if (!cliente) {
    return {
      erro: 'Cliente não encontrado. Cadastre o cliente antes de abrir o caso.',
      dica: 'Use buscar_cliente para localizar, ou cadastre pelo módulo Clientes.',
    }
  }

  const protocolo = await proximoProtocolo(escritorioId)
  const contrato = await prisma.contratoBancario.create({
    data: {
      protocolo,
      escritorioId,
      clienteId: cliente.id,
      banco: args.banco,
      numeroContrato: args.numeroContrato,
      dataContrato: new Date(args.dataContrato),
      dataPrimeiroVencimento: args.dataPrimeiroVencimento
        ? new Date(args.dataPrimeiroVencimento)
        : null,
      veiculoDescricao: args.veiculoDescricao,
      veiculoValorAVista: args.veiculoValorAVista,
      valorEntrada: args.valorEntrada ?? 0,
      valorFinanciado: args.valorFinanciado,
      totalParcelas: args.totalParcelas,
      parcelasPagas: args.parcelasPagas ?? 0,
      valorParcela: args.valorParcela,
      taxaJurosMensal: args.taxaJurosMensal,
      taxaJurosAnual: args.taxaJurosAnual ?? null,
      cetMensal: args.cetMensal ?? null,
      cetAnual: args.cetAnual ?? null,
      situacaoContrato: args.situacaoContrato ?? 'EM_CURSO',
      situacaoPagamento: args.situacaoPagamento ?? 'EM_DIA',
      querConsignar: args.querConsignar ?? false,
      avaliacaoRealizadaPor: args.avaliacaoRealizadaPor ?? 'NAO_SABE',
      veiculoTrocaDescricao: args.veiculoTrocaDescricao ?? null,
      objetivoBuscado: args.objetivoBuscado ?? null,
      encargos: {
        create: (args.encargos ?? []).map((e: any) => ({
          rubrica: e.rubrica,
          valor: e.valor,
          financiado: e.financiado ?? true,
        })),
      },
    },
    include: { encargos: true, cliente: true },
  })

  return {
    protocolo: contrato.protocolo,
    cliente: cliente.nome,
    encargosRegistrados: contrato.encargos.length,
    proximoPasso: `Rode analisar_contrato_revisional com protocolo ${contrato.protocolo}.`,
  }
}

// ── Ferramenta: analisar ───────────────────────────────────────────────────

async function toolAnalisar(args: any, escritorioId: string) {
  const contrato = await prisma.contratoBancario.findFirst({
    where: { protocolo: args.protocolo, escritorioId },
    include: { encargos: true, cliente: true },
  })
  if (!contrato) return { erro: `Protocolo ${args.protocolo} não encontrado.` }

  // GATE 1 — a base de cálculo tem de reproduzir a prestação do contrato.
  const pv = n(contrato.valorFinanciado)
  const taxa = n(contrato.taxaJurosMensal)
  const pmtCalc = prestacaoPrice(pv, taxa / 100, contrato.totalParcelas)
  const divergencia = Math.abs(pmtCalc - n(contrato.valorParcela))
  const aprovado = divergencia <= 0.5

  if (!aprovado) {
    return {
      gate1: 'TRAVADO',
      valorFinanciadoUsado: pv,
      prestacaoRecalculada: Number(pmtCalc.toFixed(2)),
      prestacaoDoContrato: n(contrato.valorParcela),
      divergencia: Number(divergencia.toFixed(2)),
      diagnostico:
        'A prestação recalculada não reproduz a do contrato. A causa mais comum é ter ' +
        'usado o preço do veículo ou o subtotal sem impostos no lugar do valor ' +
        'efetivamente financiado (campo F.6 da carta-resumo, com impostos). ' +
        'Corrija o valorFinanciado antes de prosseguir.',
    }
  }

  const bacen = await consultarBacen(contrato.dataContrato)

  const ficha = montarFicha(contrato)
  ficha.contrato.taxaMediaBacen = bacen.taxaMensal
  const decisao = decidirCaminho(ficha)

  const r = revisaoFinanciamento({
    valorFinanciado: pv,
    taxaContratada: taxa,
    taxaCorreta: bacen.taxaMensal,
    totalParcelas: contrato.totalParcelas,
    parcelasPagas: contrato.parcelasPagas,
  })

  // Cenário 2: expurgo das rubricas que a decisão reputou abusivas.
  const expurgaveis = contrato.encargos.filter((e: any) => /avalia|seguro/i.test(e.rubrica))
  const totalExpurgado = expurgaveis.reduce((s: number, e: any) => s + n(e.valor), 0)
  let beneficioComExpurgo: number | null = null
  if (totalExpurgado > 0) {
    const base = pv - totalExpurgado
    const pmtLimpo = prestacaoPrice(base, bacen.taxaMensal / 100, contrato.totalParcelas)
    let saldo = base
    for (let k = 0; k < contrato.parcelasPagas; k++) {
      saldo -= pmtLimpo - saldo * (bacen.taxaMensal / 100)
    }
    const pagoMaior = (n(contrato.valorParcela) - pmtLimpo) * contrato.parcelasPagas
    beneficioComExpurgo = Number((pagoMaior + (r.saldoContratadoAtual - saldo)).toFixed(2))
  }

  const analise = await prisma.analiseRevisional.create({
    data: {
      contratoId: contrato.id,
      prestacaoRecalculada: Number(pmtCalc.toFixed(2)),
      divergenciaGate1: Number(divergencia.toFixed(2)),
      gate1Aprovado: true,
      bacenSerie: bacen.serie,
      bacenCompetencia: bacen.competencia,
      bacenTaxaMensal: bacen.taxaMensal,
      bacenConsultadoEm: new Date(bacen.consultadoEm),
      bacenFonte: bacen.fonte,
      caminho: PARA_PRISMA[decisao.caminho] as any,
      fundamentoDecisao: decisao.fundamento,
      teses: decisao.teses,
      tesesDescartadas: decisao.tesesDescartadas as any,
      pedeGratuidade: decisao.pedeGratuidade,
      pedeTutela: decisao.pedeTutela,
      exigeDecisaoHumana: decisao.exigeDecisaoHumana,
      alertas: decisao.alertas,
      prestacaoCorreta: r.prestacaoCorreta,
      diferencaPrestacao: r.diferencaPrestacao,
      pagoAMaior: r.pagoAMaior,
      reducaoSaldo: r.reducaoSaldoDevedor,
      beneficioTotal: r.beneficioTotal,
      encargosExpurgados: totalExpurgado || null,
      beneficioComExpurgo,
      criadoPor: args.criadoPor ?? null,
    },
  })

  return {
    protocolo: contrato.protocolo,
    analiseId: analise.id,
    gate1: { aprovado: true, divergencia: Number(divergencia.toFixed(2)) },
    bacen,
    multiploSobreMedia: Number((taxa / bacen.taxaMensal).toFixed(3)),
    decisao: {
      caminho: decisao.caminho,
      fundamento: decisao.fundamento,
      teses: decisao.teses,
      tesesDescartadas: decisao.tesesDescartadas,
      pedeTutela: decisao.pedeTutela,
      pedeGratuidade: decisao.pedeGratuidade,
      exigeDecisaoHumana: decisao.exigeDecisaoHumana,
      alertas: decisao.alertas,
    },
    calculo: {
      cenario1_apenasTaxa: {
        prestacaoCobrada: r.prestacaoContratada,
        prestacaoCorreta: r.prestacaoCorreta,
        pagoAMaior: r.pagoAMaior,
        reducaoSaldo: r.reducaoSaldoDevedor,
        beneficio: r.beneficioTotal,
      },
      cenario2_comExpurgo: beneficioComExpurgo
        ? { encargosExpurgados: totalExpurgado, beneficio: beneficioComExpurgo }
        : null,
    },
    aviso:
      'Estimativa por Tabela Price. A decisão de aceitar o caso é do advogado — ' +
      'este resultado é parecer, não decisão.',
  }
}

// ── Ferramenta: consultar caso ─────────────────────────────────────────────

async function toolConsultarCaso(args: any, escritorioId: string) {
  const contrato = await prisma.contratoBancario.findFirst({
    where: { protocolo: args.protocolo, escritorioId },
    include: {
      cliente: true,
      encargos: true,
      analises: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })
  if (!contrato) return { erro: `Protocolo ${args.protocolo} não encontrado.` }

  let a = contrato.analises[0]

  // Se há documento em assinatura e ainda não consta assinado, confirma na
  // API. Deixa o painel correto mesmo quando o webhook não está configurado
  // ou perdeu um evento — o estado nunca fica velho por dependência de push.
  if (a?.autentiqueDocumentoId && !a.assinadoEm) {
    try {
      const estado = await consultarDocumento(a.autentiqueDocumentoId)
      if (estado?.concluido) {
        a = await prisma.analiseRevisional.update({
          where: { id: a.id },
          data: {
            assinadoEm: estado.assinadoEm ? new Date(estado.assinadoEm) : new Date(),
          },
        })
      }
    } catch {
      // Consulta é melhoria, não requisito: segue com o que está no banco.
    }
  }

  return {
    protocolo: contrato.protocolo,
    cliente: { nome: contrato.cliente.nome, cpf: contrato.cliente.cpfCnpj },
    contrato: {
      banco: contrato.banco,
      numero: contrato.numeroContrato,
      data: contrato.dataContrato.toISOString().slice(0, 10),
      veiculo: contrato.veiculoDescricao,
      valorFinanciado: n(contrato.valorFinanciado),
      parcelas: `${contrato.parcelasPagas}/${contrato.totalParcelas}`,
      taxaMensal: n(contrato.taxaJurosMensal),
      situacao: contrato.situacaoContrato,
      pagamento: contrato.situacaoPagamento,
    },
    encargos: contrato.encargos.map((e: any) => ({ rubrica: e.rubrica, valor: n(e.valor) })),
    ultimaAnalise: a
      ? {
          em: a.createdAt.toISOString(),
          caminho: a.caminho,
          teses: a.teses,
          beneficio: n(a.beneficioTotal),
          beneficioComExpurgo: a.beneficioComExpurgo ? n(a.beneficioComExpurgo) : null,
          assinadoEm: a.assinadoEm?.toISOString() ?? null,
          linkAssinatura: a.autentiqueLink,
          alertas: a.alertas,
        }
      : null,
  }
}

// ── Ferramenta: listar carteira ────────────────────────────────────────────

async function toolListarCasos(args: any, escritorioId: string) {
  const contratos = await prisma.contratoBancario.findMany({
    where: { escritorioId },
    include: {
      cliente: { select: { nome: true } },
      analises: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
    take: args.limite ?? 30,
  })

  const casos = contratos.map((c: any) => {
    const a = c.analises[0]
    return {
      protocolo: c.protocolo,
      cliente: c.cliente.nome,
      banco: c.banco,
      analisado: !!a,
      caminho: a?.caminho ?? null,
      beneficio: a ? n(a.beneficioComExpurgo ?? a.beneficioTotal) : null,
      assinado: !!a?.assinadoEm,
      precisaDecisaoHumana: a?.exigeDecisaoHumana ?? false,
    }
  })

  return {
    total: casos.length,
    aguardandoAnalise: casos.filter((c: any) => !c.analisado).length,
    aguardandoAssinatura: casos.filter((c: any) => c.analisado && !c.assinado).length,
    beneficioTotalEmCarteira: casos.reduce((s: number, c: any) => s + (c.beneficio ?? 0), 0),
    casos,
  }
}

// ── Ferramenta: gerar documentos e enviar para assinatura ──────────────────

async function toolGerarDocumentos(args: any, escritorioId: string) {
  const contrato = await prisma.contratoBancario.findFirst({
    where: { protocolo: args.protocolo, escritorioId },
    include: {
      cliente: true,
      encargos: true,
      escritorio: true,
      analises: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })
  if (!contrato) return { erro: `Protocolo ${args.protocolo} não encontrado.` }

  const analise = contrato.analises[0]
  if (!analise) {
    return {
      erro: 'Caso ainda não analisado.',
      dica: `Rode analisar_contrato_revisional com ${args.protocolo} antes de gerar documentos.`,
    }
  }
  if (analise.exigeDecisaoHumana) {
    return {
      erro: 'A análise exige decisão do advogado antes de gerar documentos.',
      alertas: analise.alertas,
    }
  }

  // Nenhum documento sai com buraco: campo obrigatório em falta trava aqui.
  const c = contrato.cliente
  const faltando: string[] = []
  if (!c.cpfCnpj) faltando.push('cliente.cpf')
  if (!c.rgIe) faltando.push('cliente.rg')
  if (!c.estadoCivil) faltando.push('cliente.estadoCivil')
  if (!c.profissao) faltando.push('cliente.profissao')
  if (!c.endereco) faltando.push('cliente.endereco')
  if (!args.honorariosValor) faltando.push('honorariosValor')
  if (!args.honorariosExtenso) faltando.push('honorariosExtenso')
  if (!args.honorariosFormaPagamento) faltando.push('honorariosFormaPagamento')
  if (faltando.length) {
    return {
      erro: 'Faltam dados obrigatórios. O documento NÃO foi gerado.',
      faltando,
      observacao:
        'Contrato de honorários é título executivo (art. 24 do EAOAB). Não vale gerar ' +
        'com lacuna — complete o cadastro do cliente e repita.',
    }
  }

  const email = args.email as string | undefined
  const telefone = (args.telefone ?? c.celular ?? c.telefone) as string | undefined
  if (!email && !telefone) {
    return { erro: 'Informe email ou telefone do cliente para o envio da assinatura.' }
  }

  const pdf = gerarDocumentosRevisional({
    escritorio: {
      nome: contrato.escritorio.nome,
      endereco: contrato.escritorio.endereco ?? '',
      timbradoBase64: contrato.escritorio.logo,
      rodape: [contrato.escritorio.telefone, contrato.escritorio.email]
        .filter(Boolean)
        .join(' | '),
    },
    advogados: {
      nome: args.advogadoNome ?? contrato.escritorio.nome,
      oabUf: args.advogadoOabUf ?? '',
      oabNumero: args.advogadoOabNumero ?? '',
      outorgados: args.outorgados ?? args.advogadoNome ?? contrato.escritorio.nome,
    },
    cliente: {
      nome: c.nome,
      nacionalidade: c.nacionalidade ?? 'brasileiro(a)',
      estadoCivil: c.estadoCivil as string,
      profissao: c.profissao as string,
      rg: c.rgIe as string,
      cpf: c.cpfCnpj as string,
      endereco: [c.endereco, c.bairro, c.cidade, c.estado].filter(Boolean).join(', '),
    },
    contrato: {
      numero: contrato.numeroContrato,
      banco: contrato.banco,
      data: contrato.dataContrato.toLocaleDateString('pt-BR'),
      veiculo: contrato.veiculoDescricao,
    },
    honorarios: {
      iniciaisValor: args.honorariosValor,
      iniciaisExtenso: args.honorariosExtenso,
      formaPagamento: args.honorariosFormaPagamento,
      exitoPercentual: args.exitoPercentual ?? 30,
      exitoExtenso: args.exitoExtenso ?? 'trinta por cento',
      exitoPrazoDias: 5,
      exitoPrazoExtenso: 'cinco',
      rescisaoAvisoDias: 10,
      rescisaoAvisoExtenso: 'dez',
    },
    foro: args.foro ?? [c.cidade, c.estado].filter(Boolean).join('/'),
    local: args.local ?? [c.cidade, c.estado].filter(Boolean).join('/'),
    data: new Date().toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    incluirDeclaracao: analise.pedeGratuidade,
  })

  const envio = await createContractDocument({
    pdfBuffer: pdf,
    documentName: `${contrato.protocolo} - Contrato, Procuracao e Declaracao - ${c.nome}`,
    signerName: c.nome,
    ...(email
      ? { signerEmail: email, entrega: 'email' as const }
      : { signerPhone: telefone as string, entrega: 'whatsapp' as const }),
  })

  await prisma.analiseRevisional.update({
    where: { id: analise.id },
    data: {
      autentiqueDocumentoId: envio.documentId,
      autentiqueLink: envio.signingLink,
    },
  })

  await prisma.documento.create({
    data: {
      titulo: `${contrato.protocolo} — Contrato, Procuração e Declaração`,
      tipo: 'PDF',
      escritorioId,
      clienteId: c.id,
      url: envio.signingLink ?? '',
      tamanho: pdf.length,
    },
  })

  return {
    protocolo: contrato.protocolo,
    documentoId: envio.documentId,
    linkAssinatura: envio.signingLink,
    entrega: envio.entrega,
    incluiDeclaracao: analise.pedeGratuidade,
    paginas: analise.pedeGratuidade ? 3 : 2,
    proximoPasso: 'Acompanhe com consultar_caso_revisional até constar assinado.',
  }
}

// ── Ferramenta: montar a petição inicial ───────────────────────────────────

async function toolMontarInicial(args: any, escritorioId: string) {
  const contrato = await prisma.contratoBancario.findFirst({
    where: { protocolo: args.protocolo, escritorioId },
    include: {
      cliente: true,
      encargos: true,
      analises: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })
  if (!contrato) return { erro: `Protocolo ${args.protocolo} não encontrado.` }

  const a = contrato.analises[0]
  if (!a) {
    return {
      erro: 'Caso ainda não analisado.',
      dica: `Rode analisar_contrato_revisional com ${args.protocolo} primeiro.`,
    }
  }

  const ficha = montarFicha(contrato)
  ficha.contrato.taxaMediaBacen = n(a.bacenTaxaMensal)

  const decisao = {
    caminho: Object.keys(PARA_PRISMA).find((k) => PARA_PRISMA[k] === a.caminho) as any,
    fundamento: a.fundamentoDecisao,
    teses: a.teses as any,
    tesesDescartadas: a.tesesDescartadas as any,
    pedeGratuidade: a.pedeGratuidade,
    pedeTutela: a.pedeTutela,
    exigeDecisaoHumana: a.exigeDecisaoHumana,
    alertas: a.alertas,
  }

  const montagem = montarInicial(INICIAL_MESTRE, ficha, decisao, {
    prestacaoCobrada: n(a.prestacaoRecalculada),
    prestacaoCorreta: n(a.prestacaoCorreta),
    diferencaPrestacao: n(a.diferencaPrestacao),
    pagoAMaior: n(a.pagoAMaior),
    reducaoSaldo: n(a.reducaoSaldo),
    beneficioTotal: n(a.beneficioTotal),
    somaParcelas: n(contrato.valorParcela) * contrato.totalParcelas,
  })

  return {
    protocolo: contrato.protocolo,
    caminho: decisao.caminho,
    blocosLigados: montagem.blocosLigados,
    blocosDesligados: montagem.blocosDesligados,
    valorCausa: montagem.valorCausa,
    camposFaltando: montagem.camposFaltando,
    ementasPendentes: montagem.ementasPendentes,
    peca: montagem.texto,
    instrucoes:
      'MINUTA para revisão humana. Antes de protocolar: (1) preencha os campos marcados ' +
      'como «PREENCHER»; (2) substitua cada «EMENTA PENDENTE» por acórdão conferido na ' +
      'fonte — jamais escreva ementa de memória; (3) confira as súmulas e temas citados. ' +
      'Peça com jurisprudência não verificada é risco de sanção.',
  }
}

// ── Definições expostas ao Claude ──────────────────────────────────────────

export const REVISIONAL_TOOLS = [
  {
    name: 'criar_caso_revisional',
    description:
      'Abre um caso de revisional de financiamento de veículo para um cliente já cadastrado, ' +
      'registrando os dados do contrato bancário e as rubricas cobradas. Devolve o protocolo. ' +
      'Extraia os valores da carta-resumo de CET ou da CCB. ATENÇÃO: valorFinanciado é o campo ' +
      'F.6 (valor total financiado COM impostos), nunca o preço do veículo nem o subtotal sem impostos.',
    inputSchema: {
      type: 'object',
      required: [
        'banco', 'numeroContrato', 'dataContrato', 'veiculoDescricao',
        'veiculoValorAVista', 'valorFinanciado', 'totalParcelas', 'valorParcela', 'taxaJurosMensal',
      ],
      properties: {
        clienteId: { type: 'string', description: 'ID do cliente. Alternativa ao cpf.' },
        cpf: { type: 'string', description: 'CPF do cliente, se não tiver o ID.' },
        banco: { type: 'string' },
        numeroContrato: { type: 'string', description: 'Número da CCB. Se só houver o número do orçamento, registre como tal.' },
        dataContrato: { type: 'string', description: 'AAAA-MM-DD' },
        dataPrimeiroVencimento: { type: 'string', description: 'AAAA-MM-DD' },
        veiculoDescricao: { type: 'string' },
        veiculoValorAVista: { type: 'number' },
        valorEntrada: { type: 'number' },
        valorFinanciado: { type: 'number', description: 'Campo F.6 — COM impostos.' },
        totalParcelas: { type: 'integer' },
        parcelasPagas: { type: 'integer' },
        valorParcela: { type: 'number' },
        taxaJurosMensal: { type: 'number', description: 'Percentual, ex.: 3.24' },
        taxaJurosAnual: { type: 'number' },
        cetMensal: { type: 'number' },
        cetAnual: { type: 'number' },
        situacaoContrato: { type: 'string', enum: ['EM_CURSO', 'QUITADO'] },
        situacaoPagamento: { type: 'string', enum: ['EM_DIA', 'ATRASADO', 'NEGATIVADO', 'BUSCA_APREENSAO'] },
        querConsignar: { type: 'boolean' },
        veiculoTrocaDescricao: { type: 'string' },
        avaliacaoRealizadaPor: { type: 'string', enum: ['BANCO', 'LOJA', 'NAO_SABE', 'NAO_HOUVE'] },
        objetivoBuscado: { type: 'string' },
        encargos: {
          type: 'array',
          description: 'Rubricas cobradas, com a redação exata do contrato.',
          items: {
            type: 'object',
            properties: {
              rubrica: { type: 'string' },
              valor: { type: 'number' },
              financiado: { type: 'boolean' },
            },
          },
        },
      },
    },
  },
  {
    name: 'analisar_contrato_revisional',
    description:
      'Analisa um caso: valida a base de cálculo contra a prestação do contrato (Gate 1), ' +
      'consulta a taxa média do Banco Central na competência da contratação, calcula os dois ' +
      'cenários e decide o caminho processual e as teses. Se o Gate 1 reprovar, a análise ' +
      'trava e devolve o diagnóstico. O resultado é parecer para o advogado decidir, não decisão.',
    inputSchema: {
      type: 'object',
      required: ['protocolo'],
      properties: {
        protocolo: { type: 'string', description: 'Ex.: REV-2026-0001' },
        criadoPor: { type: 'string' },
      },
    },
  },
  {
    name: 'consultar_caso_revisional',
    description:
      'Devolve a situação completa de um caso: dados do cliente, do contrato, rubricas ' +
      'cobradas e a última análise, com caminho, teses, benefício e status de assinatura.',
    inputSchema: {
      type: 'object',
      required: ['protocolo'],
      properties: { protocolo: { type: 'string' } },
    },
  },
  {
    name: 'listar_casos_revisional',
    description:
      'Lista a carteira de casos de revisional do escritório, com o que aguarda análise, ' +
      'o que aguarda assinatura, o que exige decisão humana e o benefício total em carteira.',
    inputSchema: {
      type: 'object',
      properties: { limite: { type: 'integer', default: 30 } },
    },
  },
  {
    name: 'gerar_documentos_revisional',
    description:
      'Gera contrato de honorários, procuração ad judicia et extra e — quando o caso pede ' +
      'gratuidade — declaração de hipossuficiência, num PDF único, e envia ao Autentique para ' +
      'assinatura por WhatsApp ou e-mail. Trava se faltar dado obrigatório do cliente ou dos ' +
      'honorários: contrato de honorários é título executivo e não deve sair com lacuna. ' +
      'Exige análise prévia do caso.',
    inputSchema: {
      type: 'object',
      required: ['protocolo', 'honorariosValor', 'honorariosExtenso', 'honorariosFormaPagamento'],
      properties: {
        protocolo: { type: 'string' },
        honorariosValor: { type: 'string', description: 'Em algarismos, sem R$. Ex.: "800,00"' },
        honorariosExtenso: { type: 'string', description: 'Ex.: "oitocentos reais"' },
        honorariosFormaPagamento: {
          type: 'string',
          description: 'Encaixa em "em ...". Ex.: "2 (duas) parcelas mensais de R$ 400,00"',
        },
        exitoPercentual: { type: 'number', default: 30 },
        exitoExtenso: { type: 'string', default: 'trinta por cento' },
        email: { type: 'string', description: 'Entrega por e-mail. Se omitido, vai por WhatsApp.' },
        telefone: { type: 'string', description: 'Sobrepõe o telefone do cadastro.' },
        advogadoNome: { type: 'string' },
        advogadoOabUf: { type: 'string' },
        advogadoOabNumero: { type: 'string' },
        outorgados: { type: 'string', description: 'Qualificação completa dos outorgados da procuração.' },
        foro: { type: 'string' },
        local: { type: 'string' },
      },
    },
  },
  {
    name: 'montar_inicial_revisional',
    description:
      'Monta a minuta da petição inicial a partir do modelo mestre, ligando apenas os blocos ' +
      'das teses que o contrato sustenta e o caminho processual decidido na análise. Devolve a ' +
      'peça, os blocos ligados e desligados, o valor da causa, os campos a preencher e as ementas ' +
      'pendentes. É MINUTA: exige revisão humana e conferência das citações antes de protocolar.',
    inputSchema: {
      type: 'object',
      required: ['protocolo'],
      properties: { protocolo: { type: 'string' } },
    },
  },
]

export const REVISIONAL_EXECUTORS: Record<
  string,
  (args: any, escritorioId: string) => Promise<any>
> = {
  criar_caso_revisional: toolCriarCaso,
  analisar_contrato_revisional: toolAnalisar,
  consultar_caso_revisional: toolConsultarCaso,
  listar_casos_revisional: toolListarCasos,
  gerar_documentos_revisional: toolGerarDocumentos,
  montar_inicial_revisional: toolMontarInicial,
}

/** Ferramentas que ADVOGADO pode usar (BASICO só consulta). */
export const REVISIONAL_POR_PERFIL = {
  ADVOGADO: [
    'criar_caso_revisional',
    'analisar_contrato_revisional',
    'consultar_caso_revisional',
    'listar_casos_revisional',
    'gerar_documentos_revisional',
    'montar_inicial_revisional',
  ],
  BASICO: ['consultar_caso_revisional', 'listar_casos_revisional'],
}
