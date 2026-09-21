// Montagem da petição inicial a partir do modelo mestre.
//
// O mestre (docs/revisional/inicial-mestre.md) traz TODOS os blocos. Este
// módulo liga apenas os que o caso sustenta, a partir do caminho e das teses
// devolvidos por decidirCaminho(), e substitui os campos.
//
// A IA não escolhe bloco: ela recebe a peça montada e trabalha em cima dela.
// O que fica aqui é regra, não julgamento.

import type { Decisao, Ficha, Tese } from "./decisao";

// ── Quais blocos cada coisa liga ───────────────────────────────────────────

/** Entram em toda peça, qualquer que seja o caminho. */
const BLOCOS_FIXOS = [
  "enderecamento",
  "fatos",
  "relacao_consumo",
  "repeticao",
  "pedidos",
  "valor_causa",
  "fecho",
];

/** Cada tese liga o seu bloco de fundamentação. */
const BLOCO_DA_TESE: Record<Tese, string> = {
  juros_acima_media: "tese_juros",
  cet_divergente: "tese_cet",
  tarifa_cadastro: "tese_tarifa_cadastro",
  tarifa_avaliacao: "tese_tarifa_avaliacao",
  seguro_venda_casada: "tese_seguro",
  registro_contrato: "tese_registro",
  servicos_terceiros: "tese_servicos_terceiros",
  capitalizacao: "tese_capitalizacao",
  comissao_permanencia: "tese_comissao_permanencia",
  descaracterizacao_mora: "tese_mora",
};

export interface DadosCalculo {
  prestacaoCobrada: number;
  prestacaoCorreta: number;
  diferencaPrestacao: number;
  pagoAMaior: number;
  reducaoSaldo: number;
  beneficioTotal: number;
  somaParcelas: number;
}

export interface Montagem {
  texto: string;
  blocosLigados: string[];
  blocosDesligados: string[];
  /** Lacunas de ementa que o ementário precisa preencher. */
  ementasPendentes: string[];
  /** Campos que o mestre pede e a ficha não tem. */
  camposFaltando: string[];
  valorCausa: number;
}

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const pct = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

const DENOMINACAO: Record<string, string> = {
  A_revisional_repeticao:
    "AÇÃO REVISIONAL DE CONTRATO DE FINANCIAMENTO DE VEÍCULO C/C REPETIÇÃO DE INDÉBITO",
  B_revisional_tutela:
    "AÇÃO REVISIONAL DE CONTRATO DE FINANCIAMENTO DE VEÍCULO C/C REPETIÇÃO DE INDÉBITO E PEDIDO DE TUTELA PROVISÓRIA DE URGÊNCIA",
  C_revisional_consignacao:
    "AÇÃO REVISIONAL DE CONTRATO DE FINANCIAMENTO DE VEÍCULO C/C CONSIGNAÇÃO EM PAGAMENTO, REPETIÇÃO DE INDÉBITO E PEDIDO DE TUTELA PROVISÓRIA DE URGÊNCIA",
  D_repeticao_pura:
    "AÇÃO DE REPETIÇÃO DE INDÉBITO DECORRENTE DE CONTRATO DE FINANCIAMENTO DE VEÍCULO QUITADO",
};

/** Fundamento da urgência, conforme a situação concreta. */
function fundamentoUrgencia(f: Ficha): string {
  switch (f.situacao.situacaoPagamento) {
    case "busca_apreensao":
      return (
        "Encontra-se em curso ação de busca e apreensão do veículo, de modo que a demora na " +
        "apreciação deste pedido pode resultar na perda do bem antes mesmo da discussão sobre a " +
        "legitimidade dos encargos que originaram a suposta mora."
      );
    case "negativado":
      return (
        "O nome do(a) Autor(a) já foi inscrito em cadastro restritivo de crédito em razão de " +
        "dívida cuja composição é ora impugnada, com os efeitos restritivos que daí decorrem."
      );
    case "atrasado":
      return (
        "O(A) Autor(a) encontra-se em atraso, sujeito(a), a qualquer momento, à inscrição em " +
        "cadastros restritivos e ao ajuizamento de busca e apreensão do bem, consequências de " +
        "difícil reparação."
      );
    default:
      return (
        "A continuidade da cobrança nos moldes impugnados agrava mês a mês o prejuízo " +
        "patrimonial do(a) Autor(a)."
      );
  }
}

/**
 * Reescreve as alíneas dos pedidos em sequência contínua.
 *
 * Os blocos condicionais deixam buracos (a, d, e...) quando desligados. Esta
 * função atribui letras novas na ordem em que as alíneas sobraram e ajusta os
 * subitens numerados para acompanhar a letra do item a que pertencem.
 */
function renumerarPedidos(texto: string): string {
  const letras = "abcdefghijklmnopqrstuvwxyz";
  const mapa = new Map<string, string>();
  let i = 0;

  // Primeira passada: alíneas de primeiro nível, na ordem de aparição.
  texto = texto.replace(/\*\*([a-z])\)\*\*/g, (_m, antiga: string) => {
    const nova = letras[i++] ?? antiga;
    mapa.set(antiga, nova);
    return `**${nova})**`;
  });

  // Segunda passada: subitens herdam a letra nova do item pai.
  return texto.replace(
    /\*\*([a-z])\.(\d+)\)\*\*/g,
    (_m, antiga: string, n: string) => `**${mapa.get(antiga) ?? antiga}.${n})**`
  );
}

export function montarInicial(
  mestre: string,
  ficha: Ficha,
  decisao: Decisao,
  calculo: DadosCalculo
): Montagem {
  const { cliente, contrato, situacao } = ficha;
  const quitado = decisao.caminho === "D_repeticao_pura";

  // ── 1. Conjunto de blocos ativos ─────────────────────────────────────
  const ativos = new Set(BLOCOS_FIXOS);
  for (const t of decisao.teses) ativos.add(BLOCO_DA_TESE[t]);
  if (decisao.pedeGratuidade) ativos.add("gratuidade");
  if (decisao.pedeTutela) ativos.add("tutela");
  if (decisao.caminho === "C_revisional_consignacao") ativos.add("consignacao");

  // ── 2. Condições dos sub-blocos [[SE:...]] ───────────────────────────
  const encargos = contrato.encargos ?? [];
  const acha = (re: RegExp) => encargos.find((e) => re.test(e.rubrica));
  const seguro = acha(/seguro/i);
  const totalEncargos = encargos.reduce((s, e) => s + e.valor, 0);

  const condicoes: Record<string, boolean> = {
    tem_encargos: encargos.length > 0,
    inadimplente: situacao.situacaoPagamento !== "em_dia" && !quitado,
    avaliacao_pela_loja: contrato.avaliacaoRealizadaPor === "loja",
    seguro_grupo_economico: false, // exige confirmação documental — nunca presumir
    cnpj_seguradora_em_branco: false, // idem
    pedeGratuidade: decisao.pedeGratuidade,
    pedeTutela: decisao.pedeTutela,
    querConsignar: situacao.querConsignar && !quitado,
  };

  // ── 3. Campos ────────────────────────────────────────────────────────
  const multiplo = contrato.taxaMediaBacen
    ? contrato.taxaJurosMensal / contrato.taxaMediaBacen
    : 0;
  const anual = (m: number) => (Math.pow(1 + m / 100, 12) - 1) * 100;

  const campos: Record<string, string> = {
    vara: "___",
    comarca: ficha.cliente.endereco.split(",").slice(-1)[0].trim() || "___",
    denominacao_acao: DENOMINACAO[decisao.caminho],
    banco_cnpj: "___",
    banco_endereco: "___",

    cliente_nome: cliente.nome,
    cliente_nacionalidade: cliente.nacionalidade,
    cliente_estado_civil: cliente.estadoCivil,
    cliente_profissao: cliente.profissao,
    cliente_rg: cliente.rg,
    cliente_cpf: cliente.cpf,
    cliente_endereco: cliente.endereco,

    contratado_nome: "Davi Alves Pereira",
    contratado_oab_uf: "RN",
    contratado_oab_numero: "19.347",
    contratado_endereco:
      "Rua José Alves de Queiroz, 75-A, Aluízio Diógenes, Pau dos Ferros/RN, CEP 59.900-000",

    banco_nome: contrato.banco,
    contrato_numero: contrato.numeroContrato,
    contrato_data: contrato.dataContrato.split("-").reverse().join("/"),
    veiculo_descricao: contrato.veiculoDescricao,
    veiculo_valor_avista: brl(contrato.veiculoValorAVista),
    valor_entrada: brl(contrato.valorEntrada),
    valor_financiado: brl(contrato.valorFinanciado),
    total_parcelas: String(contrato.totalParcelas),
    parcelas_pagas: String(contrato.parcelasPagas),
    parcelas_em_atraso: String(situacao.parcelasEmAtraso ?? 0),
    valor_parcela: brl(contrato.valorParcela),
    soma_parcelas: brl(calculo.somaParcelas),
    multiplicador: (calculo.somaParcelas / contrato.valorFinanciado)
      .toFixed(2)
      .replace(".", ","),

    taxa_contratada: pct(contrato.taxaJurosMensal),
    taxa_contratada_anual: pct(contrato.taxaJurosAnual ?? anual(contrato.taxaJurosMensal)),
    taxa_media_bacen: pct(contrato.taxaMediaBacen ?? 0),
    taxa_media_bacen_anual: pct(anual(contrato.taxaMediaBacen ?? 0)),
    multiplo_taxa: multiplo.toFixed(2).replace(".", ","),
    competencia_bacen: contrato.dataContrato.slice(0, 7).split("-").reverse().join("/"),
    cet_mensal: pct(contrato.cetMensal ?? 0),
    cet_anual: pct(contrato.cetAnual ?? 0),
    spread_cet: pct((contrato.cetMensal ?? 0) - contrato.taxaJurosMensal),

    tabela_encargos: encargos
      .map((e) => `- ${e.rubrica}: **${brl(e.valor)}**`)
      .join("\n"),
    total_encargos: brl(totalEncargos),
    percentual_encargos: pct((totalEncargos / contrato.valorFinanciado) * 100),

    valor_tarifa_cadastro: brl(acha(/cadastro/i)?.valor ?? 0),
    percentual_tarifa_cadastro: pct(
      ((acha(/cadastro/i)?.valor ?? 0) / contrato.valorFinanciado) * 100
    ),
    valor_tarifa_avaliacao: brl(acha(/avalia/i)?.valor ?? 0),
    valor_seguro: brl(seguro?.valor ?? 0),
    seguradora_nome: seguro?.rubrica.replace(/^seguro\s*[—-]\s*/i, "") ?? "___",
    valor_registro: brl(acha(/\breg\b|registro|gravame/i)?.valor ?? 0),
    valor_servicos_terceiros: brl(acha(/terceiro|servi/i)?.valor ?? 0),
    encargos_cumulados: "___",

    prestacao_cobrada: brl(calculo.prestacaoCobrada),
    prestacao_correta: brl(calculo.prestacaoCorreta),
    diferenca_prestacao: brl(calculo.diferencaPrestacao),
    pago_a_maior: brl(calculo.pagoAMaior),
    reducao_saldo: brl(calculo.reducaoSaldo),

    fundamento_urgencia: fundamentoUrgencia(ficha),
    local_assinatura: "Pau dos Ferros/RN",
    data_assinatura: new Date().toLocaleDateString("pt-BR"),
  };

  // ── 4. Pedidos meritórios, na ordem das teses ligadas ────────────────
  const pedidos: string[] = [];
  if (decisao.teses.includes("juros_acima_media")) {
    pedidos.push(
      `**g.1)** declarar a **abusividade da taxa de juros** de ${campos.taxa_contratada} ao mês, ` +
        `revisando-se o contrato para que incida a taxa média de mercado de ${campos.taxa_media_bacen} ` +
        `ao mês, com recálculo das prestações e do saldo devedor;`
    );
  }
  const rubricas: [Tese, string, string][] = [
    ["tarifa_cadastro", "tarifa de cadastro", campos.valor_tarifa_cadastro],
    ["tarifa_avaliacao", "tarifa de avaliação do bem", campos.valor_tarifa_avaliacao],
    ["seguro_venda_casada", "seguro embutido", campos.valor_seguro],
    ["registro_contrato", "tarifa de registro do contrato", campos.valor_registro],
    ["servicos_terceiros", "serviços de terceiros", campos.valor_servicos_terceiros],
  ];
  const nulas = rubricas.filter(([t]) => decisao.teses.includes(t));
  if (nulas.length) {
    pedidos.push(
      `**g.2)** declarar a **nulidade** das seguintes cobranças, com a consequente exclusão do ` +
        `montante financiado: ` +
        nulas.map(([, nome, v]) => `${nome} (${v})`).join("; ") +
        ";"
    );
  }
  pedidos.push(
    `**g.3)** condenar a Ré a **restituir em dobro** os valores pagos a maior, totalizando ` +
      `${brl(calculo.pagoAMaior * 2)}, ou, subsidiariamente, na forma simples ` +
      `(${brl(calculo.pagoAMaior)}), com correção monetária desde cada desembolso e juros de ` +
      `mora desde a citação;`
  );
  if (!quitado) {
    pedidos.push(
      `**g.4)** determinar a **redução do saldo devedor** em ${brl(calculo.reducaoSaldo)}, ` +
        `com a emissão de novo demonstrativo pela Ré;`
    );
  }
  campos.lista_pedidos_meritorios = pedidos.join("\n\n");

  // ── 5. Valor da causa ────────────────────────────────────────────────
  const valorCausa = calculo.pagoAMaior * 2 + (quitado ? 0 : calculo.reducaoSaldo);
  campos.valor_causa = brl(valorCausa);
  campos.composicao_valor_causa = [
    `- repetição do indébito, em dobro: ${brl(calculo.pagoAMaior * 2)}`,
    quitado ? null : `- redução do saldo devedor postulada: ${brl(calculo.reducaoSaldo)}`,
  ]
    .filter(Boolean)
    .join("\n");

  // ── 6. Montagem ──────────────────────────────────────────────────────
  const desligados: string[] = [];

  // 6a. blocos
  let texto = mestre.replace(
    /\[\[BLOCO:([a-z_]+)\]\][^\n]*\n([\s\S]*?)\[\[\/BLOCO\]\]/g,
    (_m, nome: string, corpo: string) => {
      if (ativos.has(nome)) return corpo.trim();
      desligados.push(nome);
      return "";
    }
  );

  // 6b. sub-blocos condicionais
  texto = texto.replace(
    /\[\[SE:([a-zA-Z_]+)\]\]\n([\s\S]*?)\[\[\/SE\]\]/g,
    (_m, cond: string, corpo: string) => (condicoes[cond] ? corpo.trim() : "")
  );

  // 6c. campos
  const faltando: string[] = [];
  texto = texto.replace(/\{\{([a-z0-9_]+)\}\}/g, (_m, k: string) => {
    const v = campos[k];
    if (v === undefined || v === "" || v === "___") {
      faltando.push(k);
      return `«PREENCHER: ${k}»`;
    }
    return v;
  });

  // 6d. lacunas de ementa
  const ementas: string[] = [];
  texto = texto.replace(/\[\[EMENTA:([a-z_]+)\]\]/g, (_m, t: string) => {
    ementas.push(t);
    return `> «EMENTA PENDENTE — ${t}: inserir acórdão do ementário verificado»`;
  });

  // 6e. renumeração dos pedidos
  // Blocos condicionais desligados deixam buracos na sequência (a, d, e...).
  // Renumera as alíneas na ordem em que sobraram, e reescreve os subitens
  // (g.1, g.2...) com a letra nova do item a que pertencem.
  texto = renumerarPedidos(texto);

  // 6f. limpeza: cabeçalho de instruções do mestre e separadores órfãos
  texto = texto
    .replace(/^[\s\S]*?(?=EXCELENTÍSSIMO|AÇÃO DE REPETIÇÃO)/, "")
    .replace(/\n## Citações a verificar[\s\S]*$/, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(\n---\n){2,}/g, "\n---\n")
    .trim();

  return {
    texto,
    blocosLigados: Array.from(ativos),
    blocosDesligados: desligados,
    ementasPendentes: Array.from(new Set(ementas)),
    camposFaltando: Array.from(new Set(faltando)),
    valorCausa,
  };
}
