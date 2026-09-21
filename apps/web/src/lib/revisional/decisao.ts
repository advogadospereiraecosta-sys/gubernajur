// Modelo de dados do produto "Revisional de Financiamento de Veículo".
//
// Este arquivo é a fonte única da verdade do produto. Ele serve, ao mesmo
// tempo, como:
//   - especificação dos campos do formulário público (app/revisional/ficha);
//   - schema da tabela casos_revisional no Supabase;
//   - contrato de entrada da skill que redige a peça.
//
// Nada de redação jurídica aqui — só dados e as perguntas que precisam ser
// feitas ao cliente para que a estratégia possa ser decidida.

// ── Enumerações ────────────────────────────────────────────────────────────

/** Situação do contrato de financiamento na data do atendimento. */
export type SituacaoContrato = "em_curso" | "quitado";

/** Situação do cliente perante o banco. */
export type SituacaoPagamento =
  | "em_dia"
  | "atrasado" // há parcelas vencidas, sem ação ajuizada
  | "negativado" // inscrito em SPC/Serasa
  | "busca_apreensao"; // ação de busca e apreensão já ajuizada

/** Quem realizou a avaliação do veículo dado em troca, quando houve. */
export type AutorAvaliacao = "banco" | "loja" | "nao_sabe" | "nao_houve";

/** Caminho processual — define a estrutura da petição inicial. */
export type CaminhoProcessual =
  | "A_revisional_repeticao" // em curso, em dia: sem tutela
  | "B_revisional_tutela" // em curso, inadimplente/negativado/busca
  | "C_revisional_consignacao" // em curso, quer seguir pagando o incontroverso
  | "D_repeticao_pura"; // quitado: não há o que revisar adiante

/** Teses que podem ser ligadas na peça, conforme o contrato sustentar. */
export type Tese =
  | "juros_acima_media"
  | "cet_divergente"
  | "tarifa_cadastro"
  | "tarifa_avaliacao"
  | "seguro_venda_casada"
  | "registro_contrato"
  | "servicos_terceiros"
  | "capitalizacao"
  | "comissao_permanencia" // só para contratos anteriores a set/2017
  | "descaracterizacao_mora"; // só quando há inadimplência discutida

// ── Blocos da ficha ────────────────────────────────────────────────────────

export interface DadosCliente {
  nome: string;
  cpf: string;
  rg: string;
  nacionalidade: string;
  estadoCivil: string;
  profissao: string;
  dataNascimento: string; // yyyy-mm-dd
  endereco: string;
  cep?: string;
  telefone: string;
  email: string;
  /** Renda familiar mensal — decide gratuidade e declaração de hipossuficiência. */
  rendaFamiliar?: number;
  /** Preenchido apenas quando o cliente é representado. */
  representanteLegal?: Omit<DadosCliente, "representanteLegal" | "rendaFamiliar">;
}

export interface DadosContrato {
  banco: string;
  numeroContrato: string;
  /** Data de celebração — decide, entre outras coisas, se comissão de
   *  permanência é tese viável (vedada a partir de set/2017). */
  dataContrato: string; // yyyy-mm-dd
  dataPrimeiroVencimento?: string;

  veiculoDescricao: string;
  veiculoValorAVista: number;

  /** Valor efetivamente financiado, COM impostos (campo F.6 da carta-resumo
   *  de CET). É a base do cálculo — não confundir com o valor do veículo
   *  nem com o subtotal sem impostos. */
  valorFinanciado: number;
  valorEntrada: number;

  totalParcelas: number;
  parcelasPagas: number;
  valorParcela: number;

  taxaJurosMensal: number; // % a.m., como consta do contrato
  taxaJurosAnual?: number; // % a.a.
  cetMensal?: number; // % a.m.
  cetAnual?: number; // % a.a.

  /** Taxa média de mercado do Bacen para a modalidade na data do contrato.
   *  Preenchida pelo escritório, com print da consulta anexado. */
  taxaMediaBacen?: number;

  encargos: Encargo[];

  /** Houve veículo dado em troca como entrada? Define se a tarifa de
   *  avaliação teve objeto e a quem aproveitou o serviço. */
  veiculoTrocaDescricao?: string;
  avaliacaoRealizadaPor: AutorAvaliacao;
  recebeuLaudoAvaliacao?: boolean;
}

export interface Encargo {
  /** Rubrica exatamente como consta do contrato. */
  rubrica: string;
  valor: number;
  financiado: boolean;
}

export interface DadosSituacao {
  situacaoContrato: SituacaoContrato;
  situacaoPagamento: SituacaoPagamento;
  parcelasEmAtraso?: number;
  /** O cliente quer continuar pagando o valor que entende devido? */
  querConsignar: boolean;
  /** Texto livre do cliente — quando traz indicação expressa do que busca,
   *  prevalece sobre a dedução automática, desde que compatível com os fatos. */
  objetivoBuscado: string;
  relatoFatos: string;
}

export interface Ficha {
  protocolo: string;
  criadoEm: string; // ISO
  atendidoPor: string;
  cliente: DadosCliente;
  contrato: DadosContrato;
  situacao: DadosSituacao;
  documentosEntregues: string[];
}

// ── Resultado da decisão ───────────────────────────────────────────────────

export interface Decisao {
  caminho: CaminhoProcessual;
  /** Por que este caminho — vai para o parecer e para o prompt da skill. */
  fundamento: string;
  teses: Tese[];
  /** Teses descartadas e o motivo, para que ninguém as ressuscite por engano. */
  tesesDescartadas: { tese: Tese; motivo: string }[];
  pedeGratuidade: boolean;
  pedeTutela: boolean;
  /** true quando o caso fica na fronteira entre dois caminhos: a IA não
   *  decide sozinha, devolve para o advogado. */
  exigeDecisaoHumana: boolean;
  alertas: string[];
}

// ── Árvore de decisão ──────────────────────────────────────────────────────

/** Contratos a partir desta data não admitem comissão de permanência
 *  (Resolução CMN 4.558/2017). */
const FIM_COMISSAO_PERMANENCIA = "2017-09-01";

/** Salário mínimo de referência para a triagem de gratuidade. Ajustar
 *  anualmente — é parâmetro de triagem, não critério legal. */
const SALARIO_MINIMO = 1518;

/**
 * Deriva o caminho processual e as teses a partir da ficha.
 *
 * Função pura e determinística: a IA não escolhe a estratégia no escuro —
 * ela recebe esta decisão pronta e redige em cima dela. Onde os fatos não
 * autorizam decisão segura, `exigeDecisaoHumana` fica true e o caso volta
 * para o advogado.
 */
export function decidirCaminho(ficha: Ficha): Decisao {
  const { contrato, situacao, cliente } = ficha;
  const alertas: string[] = [];
  const tesesDescartadas: Decisao["tesesDescartadas"] = [];

  // ── Consistência dos dados ───────────────────────────────────────────
  if (contrato.valorFinanciado >= contrato.veiculoValorAVista && contrato.valorEntrada > 0) {
    alertas.push(
      "Valor financiado maior ou igual ao valor do veículo, apesar de haver entrada. " +
        "Conferir se foi usado o campo correto da carta-resumo (F.6, com impostos)."
    );
  }
  if (contrato.parcelasPagas > contrato.totalParcelas) {
    alertas.push("Parcelas pagas maior que o total de parcelas — dado inconsistente.");
  }

  // ── Caminho ──────────────────────────────────────────────────────────
  let caminho: CaminhoProcessual;
  let fundamento: string;
  let exigeDecisaoHumana = false;

  const quitado =
    situacao.situacaoContrato === "quitado" ||
    contrato.parcelasPagas >= contrato.totalParcelas;

  if (quitado) {
    caminho = "D_repeticao_pura";
    fundamento =
      "Contrato quitado: não há prestação a revisar adiante, saldo a reduzir, " +
      "mora a descaracterizar nem bem a proteger. A pretensão se resolve em " +
      "repetição do indébito.";
    if (situacao.querConsignar) {
      alertas.push(
        "Cliente indicou querer consignar, mas o contrato está quitado — " +
          "consignação é incompatível. Esclarecer com o cliente."
      );
    }
  } else if (
    situacao.situacaoPagamento === "busca_apreensao" ||
    situacao.situacaoPagamento === "negativado" ||
    situacao.situacaoPagamento === "atrasado"
  ) {
    caminho = "B_revisional_tutela";
    fundamento =
      `Contrato em curso com inadimplência (${situacao.situacaoPagamento}): ` +
      "há urgência concreta a demonstrar, o que sustenta o pedido de tutela.";
    if (situacao.querConsignar) {
      caminho = "C_revisional_consignacao";
      fundamento +=
        " Cliente pretende seguir pagando o valor incontroverso, o que recomenda " +
        "cumular consignação em pagamento.";
    }
  } else if (situacao.querConsignar) {
    caminho = "C_revisional_consignacao";
    fundamento =
      "Contrato em curso e cliente adimplente que pretende depositar apenas o " +
      "valor que entende devido: consignação em pagamento com tutela para " +
      "obstar os efeitos da mora.";
  } else {
    caminho = "A_revisional_repeticao";
    fundamento =
      "Contrato em curso e cliente em dia: não há urgência a demonstrar. " +
      "Pedir tutela aqui convida indeferimento na entrada — a ação se resolve " +
      "em revisão da taxa e repetição do indébito.";
  }

  // Indicação expressa do cliente prevalece, desde que compatível.
  const objetivo = situacao.objetivoBuscado?.toLowerCase() ?? "";
  if (objetivo.trim().length > 0) {
    const pedeConsignar = /consigna|depositar|continuar pagando/.test(objetivo);
    if (pedeConsignar && !situacao.querConsignar && !quitado) {
      exigeDecisaoHumana = true;
      alertas.push(
        'O objetivo relatado menciona consignação, mas o campo "quer consignar" ' +
          "está negativo. Confirmar com o cliente antes de definir o caminho."
      );
    }
  }

  // ── Teses ────────────────────────────────────────────────────────────
  const teses: Tese[] = [];

  if (contrato.taxaMediaBacen && contrato.taxaJurosMensal > contrato.taxaMediaBacen) {
    const multiplo = contrato.taxaJurosMensal / contrato.taxaMediaBacen;
    if (multiplo >= 1.5) {
      teses.push("juros_acima_media");
    } else {
      tesesDescartadas.push({
        tese: "juros_acima_media",
        motivo:
          `Taxa ${multiplo.toFixed(2)}x a média do Bacen. Abaixo de 1,5x a ` +
          "discrepância dificilmente é reconhecida como abusiva (Súmula 382/STJ; " +
          "REsp 1.061.530/RS, Tema 27).",
      });
    }
  } else if (!contrato.taxaMediaBacen) {
    alertas.push(
      "Taxa média do Bacen não informada — sem ela não há como sustentar a " +
        "abusividade dos juros. Consultar a série da modalidade na data do contrato."
    );
  }

  if (contrato.cetMensal && contrato.cetMensal > contrato.taxaJurosMensal * 1.2) {
    teses.push("cet_divergente");
  }

  for (const e of contrato.encargos) {
    // Normaliza acentos: as rubricas vêm abreviadas e acentuadas de formas
    // diferentes conforme o banco ("Reg.Cont -Órg.Trâns.", "Registro de
    // contrato", "REG. GRAVAME").
    const r = e.rubrica
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    if (/cadastro/.test(r)) teses.push("tarifa_cadastro");
    else if (/avalia/.test(r)) teses.push("tarifa_avaliacao");
    else if (/seguro/.test(r)) teses.push("seguro_venda_casada");
    else if (/\breg\b|registro|gravame|org.*trans|detran/.test(r))
      teses.push("registro_contrato");
    else if (/terceiro|servi|despachante/.test(r)) teses.push("servicos_terceiros");
  }

  // A tarifa de avaliação depende de quem prestou o serviço e a quem aproveitou.
  if (teses.includes("tarifa_avaliacao")) {
    if (contrato.avaliacaoRealizadaPor === "loja") {
      alertas.push(
        "Avaliação feita pela loja: o serviço aproveitou à compra e venda, não " +
          "à operação de crédito. Pedir exibição do laudo na inicial."
      );
    } else if (contrato.avaliacaoRealizadaPor === "nao_houve") {
      alertas.push(
        "Tarifa de avaliação cobrada sem que tenha havido avaliação — tese forte " +
          "de cobrança por serviço não prestado (Tema 958/STJ)."
      );
    } else if (contrato.avaliacaoRealizadaPor === "nao_sabe") {
      alertas.push(
        "Não se sabe quem avaliou o veículo. Perguntar ao cliente: define a " +
          "força da tese da tarifa de avaliação."
      );
    }
  }

  if (contrato.dataContrato < FIM_COMISSAO_PERMANENCIA) {
    teses.push("comissao_permanencia");
  } else {
    tesesDescartadas.push({
      tese: "comissao_permanencia",
      motivo:
        "Contrato posterior a set/2017: comissão de permanência vedada pela " +
        "Resolução CMN 4.558/2017. Alegá-la sinaliza peça de formulário.",
    });
  }

  // A descaracterização da mora depende de DUAS condições cumulativas:
  // haver mora a descaracterizar, e a abusividade estar nos juros
  // remuneratórios — o encargo da normalidade contratual.
  //
  // O Tema 972, item 3, do STJ é expresso: "a abusividade de encargos
  // acessórios do contrato não descaracteriza a mora". Tarifa e seguro são
  // encargos acessórios. Alegar descaracterização com base neles contraria
  // tese vinculante e entrega à parte contrária um argumento de contestação.
  const temMora =
    caminho === "B_revisional_tutela" || caminho === "C_revisional_consignacao";
  const jurosAbusivos = teses.includes("juros_acima_media");

  if (temMora && jurosAbusivos) {
    teses.push("descaracterizacao_mora");
  } else if (!temMora) {
    tesesDescartadas.push({
      tese: "descaracterizacao_mora",
      motivo: "Não há mora a descaracterizar: cliente adimplente ou contrato quitado.",
    });
  } else {
    tesesDescartadas.push({
      tese: "descaracterizacao_mora",
      motivo:
        "Há mora, mas a abusividade apurada está em encargos acessórios (tarifas, " +
        "seguro), e não nos juros remuneratórios. O Tema 972, item 3, do STJ afasta " +
        "a descaracterização nessa hipótese.",
    });
  }

  // ── Gratuidade e tutela ──────────────────────────────────────────────
  const pedeGratuidade =
    cliente.rendaFamiliar !== undefined && cliente.rendaFamiliar <= SALARIO_MINIMO * 3;

  const pedeTutela =
    caminho === "B_revisional_tutela" || caminho === "C_revisional_consignacao";

  if (teses.length === 0) {
    exigeDecisaoHumana = true;
    alertas.push(
      "Nenhuma tese ligada pelos dados informados. Caso provavelmente inviável — " +
        "revisar antes de propor a ação."
    );
  }

  return {
    caminho,
    fundamento,
    teses: Array.from(new Set(teses)),
    tesesDescartadas,
    pedeGratuidade,
    pedeTutela,
    exigeDecisaoHumana,
    alertas,
  };
}
