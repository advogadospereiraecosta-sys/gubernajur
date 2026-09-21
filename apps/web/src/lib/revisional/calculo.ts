// Núcleo de cálculo das calculadoras de Direito Bancário.
// Funções puras, sem dependência de UI.
//
// Metodologia: sistema francês de amortização (Tabela Price), adotado pela
// esmagadora maioria dos contratos bancários brasileiros de financiamento de
// veículo e de empréstimo consignado.
//
//   PMT = PV · i / (1 − (1 + i)^−n)
//
// A revisão compara a evolução do contrato pela taxa efetivamente cobrada com
// a evolução pela taxa tida por correta — em regra a taxa média de mercado
// divulgada pelo Banco Central para a modalidade (STJ, REsp 1.061.530/RS,
// Tema 27; Súmula 530/STJ).

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface LinhaAmortizacao {
  parcela: number;
  saldoContratado: number;
  saldoCorreto: number;
  jurosContratado: number;
  jurosCorreto: number;
  amortizacaoContratada: number;
  amortizacaoCorreta: number;
  prestacaoContratada: number;
  prestacaoCorreta: number;
  diferencaPrestacao: number;
}

export interface ResultadoRevisao {
  prestacaoContratada: number;
  prestacaoCorreta: number;
  diferencaPrestacao: number;
  parcelasPagas: number;
  /** Quanto o consumidor já pagou a maior até a parcela informada. */
  pagoAMaior: number;
  saldoContratadoAtual: number;
  saldoCorretoAtual: number;
  /** Diferença entre o saldo devedor cobrado e o saldo devedor correto. */
  reducaoSaldoDevedor: number;
  /** Benefício econômico total da revisão (pago a maior + redução do saldo). */
  beneficioTotal: number;
  totalContratado: number;
  totalCorreto: number;
  tabela: LinhaAmortizacao[];
}

export interface ResultadoQuitado {
  prestacaoContratada: number;
  prestacaoCorreta: number;
  diferencaPrestacao: number;
  totalParcelas: number;
  totalContratado: number;
  totalCorreto: number;
  /** Valor pago a maior ao longo de todo o contrato, sem correção. */
  pagoAMaior: number;
  /** Percentual de correção monetária aplicado. */
  correcaoMonetaria: number;
  valorCorrecao: number;
  /** Valor a restituir já corrigido. */
  totalRestituir: number;
  /** Restituição em dobro (CDC, art. 42, parágrafo único). */
  totalRestituirEmDobro: number;
  tabela: LinhaAmortizacao[];
}

export interface LinhaTarifa {
  indice: number;
  valorOriginal: number;
  meses: number;
  fator: number;
  valorAtualizado: number;
  jurosAcrescidos: number;
}

export interface ResultadoTarifas {
  dataContrato: string;
  dataCalculo: string;
  meses: number;
  taxaJurosMensal: number;
  totalOriginal: number;
  totalAtualizado: number;
  totalJuros: number;
  totalEmDobro: number;
  tabela: LinhaTarifa[];
}

export interface ResultadoTaxa {
  taxaMensal: number;
  taxaAnual: number;
  valorFinanciado: number;
  numeroParcelas: number;
  valorPrestacao: number;
  totalPago: number;
  totalJuros: number;
  /** true quando os dados são inconsistentes e não há taxa a apurar. */
  indeterminada: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const round2 = (n: number) => Math.round(n * 100) / 100;

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const pct = (n: number) =>
  n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }) + "%";

/**
 * Prestação pelo sistema francês (Tabela Price).
 * @param pv valor financiado
 * @param i taxa mensal em fração decimal (0,025 = 2,5% a.m.)
 * @param n número total de parcelas
 */
export function prestacaoPrice(pv: number, i: number, n: number): number {
  if (n <= 0) return 0;
  if (i === 0) return pv / n;
  return (pv * i) / (1 - Math.pow(1 + i, -n));
}

/** Número de meses inteiros completos entre duas datas. */
export function mesesEntre(inicio: Date, fim: Date): number {
  let meses =
    (fim.getFullYear() - inicio.getFullYear()) * 12 +
    (fim.getMonth() - inicio.getMonth());
  if (fim.getDate() < inicio.getDate()) meses -= 1;
  return Math.max(0, meses);
}

// ── 1. Revisão de financiamento em curso ───────────────────────────────────

export function revisaoFinanciamento(input: {
  valorFinanciado: number;
  taxaContratada: number; // % a.m.
  taxaCorreta: number; // % a.m.
  totalParcelas: number;
  parcelasPagas: number;
}): ResultadoRevisao {
  const { valorFinanciado, totalParcelas } = input;
  const iC = input.taxaContratada / 100;
  const iR = input.taxaCorreta / 100;
  const pagas = Math.min(Math.max(0, input.parcelasPagas), totalParcelas);

  const pmtC = prestacaoPrice(valorFinanciado, iC, totalParcelas);
  const pmtR = prestacaoPrice(valorFinanciado, iR, totalParcelas);

  const tabela: LinhaAmortizacao[] = [];
  let saldoC = valorFinanciado;
  let saldoR = valorFinanciado;
  let saldoContratadoAtual = valorFinanciado;
  let saldoCorretoAtual = valorFinanciado;

  for (let k = 1; k <= totalParcelas; k++) {
    const jurosC = saldoC * iC;
    const jurosR = saldoR * iR;
    const amortC = pmtC - jurosC;
    const amortR = pmtR - jurosR;

    tabela.push({
      parcela: k,
      saldoContratado: round2(saldoC),
      saldoCorreto: round2(saldoR),
      jurosContratado: round2(jurosC),
      jurosCorreto: round2(jurosR),
      amortizacaoContratada: round2(amortC),
      amortizacaoCorreta: round2(amortR),
      prestacaoContratada: round2(pmtC),
      prestacaoCorreta: round2(pmtR),
      diferencaPrestacao: round2(pmtC - pmtR),
    });

    saldoC -= amortC;
    saldoR -= amortR;

    if (k === pagas) {
      saldoContratadoAtual = saldoC;
      saldoCorretoAtual = saldoR;
    }
  }

  const pagoAMaior = (pmtC - pmtR) * pagas;
  const reducaoSaldoDevedor = saldoContratadoAtual - saldoCorretoAtual;

  return {
    prestacaoContratada: round2(pmtC),
    prestacaoCorreta: round2(pmtR),
    diferencaPrestacao: round2(pmtC - pmtR),
    parcelasPagas: pagas,
    pagoAMaior: round2(pagoAMaior),
    saldoContratadoAtual: round2(saldoContratadoAtual),
    saldoCorretoAtual: round2(saldoCorretoAtual),
    reducaoSaldoDevedor: round2(reducaoSaldoDevedor),
    beneficioTotal: round2(pagoAMaior + reducaoSaldoDevedor),
    totalContratado: round2(pmtC * totalParcelas),
    totalCorreto: round2(pmtR * totalParcelas),
    tabela,
  };
}

// ── 2. Financiamento já quitado ────────────────────────────────────────────

export function financiamentoQuitado(input: {
  valorFinanciado: number;
  taxaContratada: number; // % a.m.
  taxaCorreta: number; // % a.m.
  totalParcelas: number;
  correcaoMonetaria: number; // % acumulado no período
}): ResultadoQuitado {
  const base = revisaoFinanciamento({
    valorFinanciado: input.valorFinanciado,
    taxaContratada: input.taxaContratada,
    taxaCorreta: input.taxaCorreta,
    totalParcelas: input.totalParcelas,
    parcelasPagas: input.totalParcelas,
  });

  const pagoAMaior = base.totalContratado - base.totalCorreto;
  const valorCorrecao = pagoAMaior * (input.correcaoMonetaria / 100);
  const totalRestituir = pagoAMaior + valorCorrecao;

  return {
    prestacaoContratada: base.prestacaoContratada,
    prestacaoCorreta: base.prestacaoCorreta,
    diferencaPrestacao: base.diferencaPrestacao,
    totalParcelas: input.totalParcelas,
    totalContratado: base.totalContratado,
    totalCorreto: base.totalCorreto,
    pagoAMaior: round2(pagoAMaior),
    correcaoMonetaria: input.correcaoMonetaria,
    valorCorrecao: round2(valorCorrecao),
    totalRestituir: round2(totalRestituir),
    totalRestituirEmDobro: round2(totalRestituir * 2),
    tabela: base.tabela,
  };
}

// ── 3. Tarifas abusivas ────────────────────────────────────────────────────

export function tarifasAbusivas(input: {
  dataContrato: string; // yyyy-mm-dd
  taxaJurosMensal: number; // % a.m.
  tarifas: number[];
  dataCalculo?: Date;
}): ResultadoTarifas {
  const inicio = new Date(input.dataContrato + "T12:00:00");
  const fim = input.dataCalculo ?? new Date();
  const meses = mesesEntre(inicio, fim);
  const i = input.taxaJurosMensal / 100;
  const fator = Math.pow(1 + i, meses);

  const tabela: LinhaTarifa[] = input.tarifas
    .filter((v) => v > 0)
    .map((valorOriginal, idx) => {
      const valorAtualizado = valorOriginal * fator;
      return {
        indice: idx + 1,
        valorOriginal: round2(valorOriginal),
        meses,
        fator,
        valorAtualizado: round2(valorAtualizado),
        jurosAcrescidos: round2(valorAtualizado - valorOriginal),
      };
    });

  const totalOriginal = tabela.reduce((s, t) => s + t.valorOriginal, 0);
  const totalAtualizado = tabela.reduce((s, t) => s + t.valorAtualizado, 0);

  return {
    dataContrato: input.dataContrato,
    dataCalculo: fim.toISOString().slice(0, 10),
    meses,
    taxaJurosMensal: input.taxaJurosMensal,
    totalOriginal: round2(totalOriginal),
    totalAtualizado: round2(totalAtualizado),
    totalJuros: round2(totalAtualizado - totalOriginal),
    totalEmDobro: round2(totalAtualizado * 2),
    tabela,
  };
}

// ── 4. Taxa de juros mensal implícita ──────────────────────────────────────

/**
 * Resolve i em PMT = PV · i / (1 − (1 + i)^−n) por bissecção.
 * A prestação é monotônica crescente em i, de modo que a bissecção converge
 * sempre que a raiz existir dentro do intervalo pesquisado.
 */
export function taxaJurosMensal(input: {
  valorFinanciado: number;
  numeroParcelas: number;
  valorPrestacao: number;
}): ResultadoTaxa {
  const { valorFinanciado: pv, numeroParcelas: n, valorPrestacao: pmt } = input;

  const base: ResultadoTaxa = {
    taxaMensal: 0,
    taxaAnual: 0,
    valorFinanciado: pv,
    numeroParcelas: n,
    valorPrestacao: pmt,
    totalPago: round2(pmt * n),
    totalJuros: round2(pmt * n - pv),
    indeterminada: true,
  };

  if (pv <= 0 || n <= 0 || pmt <= 0) return base;
  // Prestação que não cobre o principal: não há taxa positiva a apurar.
  if (pmt * n < pv) return base;
  // Soma das prestações igual ao principal: contrato sem juros.
  if (pmt * n === pv) return { ...base, indeterminada: false };

  let lo = 0;
  let hi = 1; // 100% a.m. — teto folgado para contratos bancários
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const valor = prestacaoPrice(pv, mid, n);
    if (valor > pmt) hi = mid;
    else lo = mid;
    if (Math.abs(valor - pmt) < 1e-10) break;
  }

  const i = (lo + hi) / 2;

  return {
    ...base,
    taxaMensal: Math.round(i * 100 * 10000) / 10000,
    taxaAnual: Math.round((Math.pow(1 + i, 12) - 1) * 100 * 10000) / 10000,
    indeterminada: false,
  };
}
