'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  FileSignature,
  Scale,
  TrendingDown,
} from 'lucide-react'

export type CasoResumo = {
  protocolo: string
  cliente: string
  clienteCpf: string | null
  banco: string
  veiculo: string
  dataContrato: string
  valorFinanciado: number
  parcelas: string
  taxaMensal: number
  situacaoContrato: string
  situacaoPagamento: string
  analise: {
    em: string
    caminho: string
    teses: string[]
    tesesDescartadas: { tese: string; motivo: string }[]
    alertas: string[]
    exigeDecisaoHumana: boolean
    pedeTutela: boolean
    pedeGratuidade: boolean
    taxaMediaBacen: number
    bacenCompetencia: string
    bacenFonte: string
    prestacaoCobrada: number
    prestacaoCorreta: number
    pagoAMaior: number
    reducaoSaldo: number
    beneficioTotal: number
    beneficioComExpurgo: number | null
    linkAssinatura: string | null
    assinadoEm: string | null
  } | null
}

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const pct = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'

const CAMINHO_ROTULO: Record<string, string> = {
  A_REVISIONAL_REPETICAO: 'Revisional + repetição',
  B_REVISIONAL_TUTELA: 'Revisional + tutela',
  C_REVISIONAL_CONSIGNACAO: 'Revisional + consignação',
  D_REPETICAO_PURA: 'Repetição pura (quitado)',
}

const TESE_ROTULO: Record<string, string> = {
  juros_acima_media: 'Juros acima da média',
  cet_divergente: 'CET divergente',
  tarifa_cadastro: 'Tarifa de cadastro',
  tarifa_avaliacao: 'Tarifa de avaliação',
  seguro_venda_casada: 'Seguro — venda casada',
  registro_contrato: 'Registro do contrato',
  servicos_terceiros: 'Serviços de terceiros',
  capitalizacao: 'Capitalização',
  comissao_permanencia: 'Comissão de permanência',
  descaracterizacao_mora: 'Descaracterização da mora',
}

function Etapa({ caso }: { caso: CasoResumo }) {
  if (!caso.analise) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        <Clock className="h-3 w-3" /> aguarda análise
      </span>
    )
  }
  if (caso.analise.exigeDecisaoHumana) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
        <AlertTriangle className="h-3 w-3" /> decisão do advogado
      </span>
    )
  }
  if (caso.analise.assinadoEm) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> assinado
      </span>
    )
  }
  if (caso.analise.linkAssinatura) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
        <FileSignature className="h-3 w-3" /> aguarda assinatura
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      analisado
    </span>
  )
}

function Metrica({
  rotulo,
  valor,
  destaque,
  nota,
}: {
  rotulo: string
  valor: string
  destaque?: boolean
  nota?: string
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        destaque ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200 bg-white'
      }`}
    >
      <p
        className={`text-[11px] font-semibold uppercase tracking-wide ${
          destaque ? 'text-slate-300' : 'text-slate-500'
        }`}
      >
        {rotulo}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums">{valor}</p>
      {nota && (
        <p className={`mt-0.5 text-xs ${destaque ? 'text-slate-400' : 'text-slate-500'}`}>
          {nota}
        </p>
      )}
    </div>
  )
}

function Detalhe({ caso }: { caso: CasoResumo }) {
  const a = caso.analise
  if (!a) {
    return (
      <div className="border-t border-slate-200 bg-slate-50 px-6 py-5 text-sm text-slate-600">
        Caso ainda não analisado. Peça ao Claude:{' '}
        <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">
          analisar_contrato_revisional {caso.protocolo}
        </code>
      </div>
    )
  }

  const multiplo = a.taxaMediaBacen ? caso.taxaMensal / a.taxaMediaBacen : 0

  return (
    <div className="space-y-5 border-t border-slate-200 bg-slate-50 px-6 py-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metrica rotulo="Prestação cobrada" valor={brl(a.prestacaoCobrada)} />
        <Metrica rotulo="Prestação correta" valor={brl(a.prestacaoCorreta)} />
        <Metrica
          rotulo="Pago a maior"
          valor={brl(a.pagoAMaior)}
          nota={`em ${caso.parcelas} parcelas`}
        />
        <Metrica
          rotulo="Benefício estimado"
          valor={brl(a.beneficioComExpurgo ?? a.beneficioTotal)}
          destaque
          nota={a.beneficioComExpurgo ? 'com expurgo de encargos' : 'só revisão da taxa'}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Taxa de juros
          </h4>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Contratada</dt>
              <dd className="font-semibold tabular-nums">{pct(caso.taxaMensal)} a.m.</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">
                Média Bacen ({a.bacenCompetencia})
              </dt>
              <dd className="font-semibold tabular-nums">{pct(a.taxaMediaBacen)} a.m.</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1">
              <dt className="text-slate-600">Múltiplo sobre a média</dt>
              <dd
                className={`font-bold tabular-nums ${
                  multiplo >= 1.5 ? 'text-red-600' : 'text-slate-700'
                }`}
              >
                {multiplo.toFixed(2).replace('.', ',')}×
              </dd>
            </div>
          </dl>
          <a
            href={a.bacenFonte}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            consulta oficial à série 25471 <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Teses ligadas
          </h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {a.teses.map((t) => (
              <span
                key={t}
                className="rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-white"
              >
                {TESE_ROTULO[t] ?? t}
              </span>
            ))}
          </div>
          {a.tesesDescartadas.length > 0 && (
            <>
              <h4 className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Descartadas
              </h4>
              <ul className="mt-1.5 space-y-1">
                {a.tesesDescartadas.map((t) => (
                  <li key={t.tese} className="text-xs text-slate-600">
                    <span className="font-medium line-through">
                      {TESE_ROTULO[t.tese] ?? t.tese}
                    </span>{' '}
                    — {t.motivo}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {a.alertas.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5" /> A confirmar
          </h4>
          <ul className="mt-1.5 space-y-1">
            {a.alertas.map((al, i) => (
              <li key={i} className="text-sm text-amber-900">
                {al}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-md bg-white px-2.5 py-1 font-medium text-slate-700 ring-1 ring-slate-200">
          {CAMINHO_ROTULO[a.caminho] ?? a.caminho}
        </span>
        {a.pedeTutela && (
          <span className="text-slate-600">com pedido de tutela</span>
        )}
        {a.pedeGratuidade && <span className="text-slate-600">com gratuidade</span>}
        {a.linkAssinatura && (
          <a
            href={a.linkAssinatura}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
          >
            <FileSignature className="h-3.5 w-3.5" />
            {a.assinadoEm ? 'ver documento assinado' : 'link de assinatura'}
          </a>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Estimativa por Tabela Price. A decisão de aceitar o caso é do advogado — este
        resultado é parecer, não decisão.
      </p>
    </div>
  )
}

export function RevisionalClient({ casos }: { casos: CasoResumo[] }) {
  const [aberto, setAberto] = useState<string | null>(null)

  const resumo = useMemo(() => {
    const analisados = casos.filter((c) => c.analise)
    return {
      total: casos.length,
      aguardaAnalise: casos.filter((c) => !c.analise).length,
      aguardaAssinatura: analisados.filter(
        (c) => c.analise!.linkAssinatura && !c.analise!.assinadoEm
      ).length,
      exigemDecisao: analisados.filter((c) => c.analise!.exigeDecisaoHumana).length,
      carteira: analisados.reduce(
        (s, c) => s + (c.analise!.beneficioComExpurgo ?? c.analise!.beneficioTotal),
        0
      ),
    }
  }, [casos])

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Scale className="h-6 w-6" />
          Revisional de Veículo
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Casos de revisão de contrato de financiamento. Abertura, análise e documentos
          são operados pelo Claude via conector — esta tela acompanha a carteira.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metrica rotulo="Casos" valor={String(resumo.total)} />
        <Metrica
          rotulo="Aguardam análise"
          valor={String(resumo.aguardaAnalise)}
        />
        <Metrica
          rotulo="Aguardam assinatura"
          valor={String(resumo.aguardaAssinatura)}
        />
        <Metrica
          rotulo="Benefício em carteira"
          valor={brl(resumo.carteira)}
          destaque
          nota="soma das estimativas"
        />
      </div>

      {resumo.exigemDecisao > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
          <p className="text-sm text-red-900">
            <strong>{resumo.exigemDecisao}</strong>{' '}
            {resumo.exigemDecisao === 1 ? 'caso ficou' : 'casos ficaram'} na fronteira
            entre dois caminhos processuais e{' '}
            {resumo.exigemDecisao === 1 ? 'aguarda' : 'aguardam'} sua decisão.
          </p>
        </div>
      )}

      {casos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center">
          <Scale className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-700">Nenhum caso ainda</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Peça ao Claude para abrir o primeiro:{' '}
            <em>&ldquo;abre um caso de revisional para [cliente], contrato do [banco]&rdquo;</em>.
            O cliente precisa estar cadastrado antes.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {casos.map((caso) => (
            <div key={caso.protocolo} className="border-b border-slate-100 last:border-0">
              <button
                onClick={() =>
                  setAberto(aberto === caso.protocolo ? null : caso.protocolo)
                }
                className="flex w-full items-center gap-4 px-6 py-4 text-left hover:bg-slate-50"
              >
                {aberto === caso.protocolo ? (
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">
                      {caso.protocolo}
                    </span>
                    <span className="font-semibold text-slate-900">{caso.cliente}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-600">
                    {caso.banco} · {caso.veiculo} · {caso.parcelas} parcelas ·{' '}
                    {pct(caso.taxaMensal)} a.m.
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-4">
                  {caso.analise && (
                    <span className="hidden items-center gap-1 text-sm font-semibold text-slate-900 sm:flex">
                      <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
                      {brl(caso.analise.beneficioComExpurgo ?? caso.analise.beneficioTotal)}
                    </span>
                  )}
                  <Etapa caso={caso} />
                </div>
              </button>
              {aberto === caso.protocolo && <Detalhe caso={caso} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
