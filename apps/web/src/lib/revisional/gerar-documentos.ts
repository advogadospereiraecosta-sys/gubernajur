/**
 * Contrato de honorários + procuração ad judicia et extra + declaração de
 * hipossuficiência, num PDF único — um documento, uma assinatura.
 *
 * A redação é a mesma do modelo revisado do escritório, com o fecho adaptado
 * à assinatura eletrônica: sem menção a vias físicas nem a testemunhas, e com
 * o reconhecimento expresso exigido pelo art. 10, § 2º, da MP 2.200-2/2001.
 */

import {
  criarContextoPDF,
  desenharCabecalhoDocumento,
  desenharTitulo,
  numerarPaginas,
  NAVY,
  GRAY,
  type PdfContext,
  type Timbrado,
} from "./pdf-base";

export interface DadosDocumentos {
  escritorio: {
    nome: string;
    endereco: string;
    timbradoBase64?: string | null;
    rodape?: string;
  };
  advogados: {
    /** Subscritor do contrato. */
    nome: string;
    oabUf: string;
    oabNumero: string;
    /** Texto completo dos outorgados da procuração. */
    outorgados: string;
  };
  cliente: {
    nome: string;
    nacionalidade: string;
    estadoCivil: string;
    profissao: string;
    rg: string;
    cpf: string;
    endereco: string;
  };
  contrato: {
    numero: string;
    banco: string;
    data: string; // dd/mm/aaaa
    veiculo: string;
  };
  honorarios: {
    iniciaisValor: string; // "800,00"
    iniciaisExtenso: string; // "oitocentos reais"
    formaPagamento: string;
    exitoPercentual: number; // 30
    exitoExtenso: string; // "trinta por cento"
    exitoPrazoDias: number;
    exitoPrazoExtenso: string;
    rescisaoAvisoDias: number;
    rescisaoAvisoExtenso: string;
  };
  foro: string;
  local: string;
  data: string; // por extenso
  /** Só entra se o caso pedir gratuidade. */
  incluirDeclaracao: boolean;
}

function qualificacao(c: DadosDocumentos["cliente"]): string {
  return (
    `${c.nome}, ${c.nacionalidade}, ${c.estadoCivil}, ${c.profissao}, portador(a) do RG nº ` +
    `${c.rg} e inscrito(a) no CPF sob o nº ${c.cpf}, residente e domiciliado(a) à ${c.endereco}`
  );
}

function assinatura(ctx: PdfContext, rotulo: string, nome: string, cpf: string) {
  ctx.y += 10;
  if (ctx.y > ctx.H - 45) ctx.novaPagina();
  ctx.doc.setDrawColor(...NAVY);
  ctx.doc.setLineWidth(0.4);
  ctx.doc.line(ctx.W / 2 - 45, ctx.y, ctx.W / 2 + 45, ctx.y);
  ctx.y += 5;
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(8);
  ctx.doc.setTextColor(...NAVY);
  ctx.doc.text(rotulo, ctx.W / 2, ctx.y, { align: "center" });
  ctx.y += 4;
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(7.5);
  ctx.doc.setTextColor(...GRAY);
  ctx.doc.text(nome, ctx.W / 2, ctx.y, { align: "center", maxWidth: 120 });
  ctx.y += 4;
  ctx.doc.setFontSize(7);
  ctx.doc.text(`CPF: ${cpf}`, ctx.W / 2, ctx.y, { align: "center" });
}

function dataLocal(ctx: PdfContext, local: string, data: string) {
  ctx.y += 6;
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(8.5);
  ctx.doc.setTextColor(...GRAY);
  ctx.doc.text(`${local}, ${data}.`, ctx.W / 2, ctx.y, { align: "center" });
}

// ── Contrato de honorários ─────────────────────────────────────────────────

function renderContrato(ctx: PdfContext, d: DadosDocumentos) {
  const h = d.honorarios;

  ctx.h1("PARTES");
  ctx.p(`CONTRATANTE: ${qualificacao(d.cliente)}.`);
  ctx.p(
    `CONTRATADO: ${d.advogados.nome}, inscrito na OAB/${d.advogados.oabUf} sob o nº ` +
      `${d.advogados.oabNumero}, com escritório profissional à ${d.escritorio.endereco}.`
  );

  ctx.h1("CLÁUSULA 1 — DO OBJETO");
  ctx.p(
    "O presente contrato tem por objeto a prestação de serviços advocatícios consistentes no " +
      `patrocínio de Ação Revisional do Contrato de Financiamento de Veículo nº ${d.contrato.numero}, ` +
      `firmado entre o CONTRATANTE e ${d.contrato.banco} em ${d.contrato.data}, tendo por objeto o ` +
      `veículo ${d.contrato.veiculo}, abrangendo a análise do contrato original, estudo de cálculos, ` +
      "elaboração e protocolo da petição inicial, acompanhamento processual em todas as fases, " +
      "inclusive recursos, até decisão final em 1ª e 2ª instância."
  );

  ctx.h1("CLÁUSULA 2 — DOS HONORÁRIOS");
  ctx.p(
    `2.1 Honorários Iniciais: O CONTRATANTE pagará ao CONTRATADO o valor de R$ ${h.iniciaisValor} ` +
      `(${h.iniciaisExtenso}), a título de honorários iniciais, em ${h.formaPagamento}, destinados a ` +
      "custear a análise, elaboração da ação e acompanhamento do processo."
  );
  ctx.p(
    `2.2 Honorários de Êxito: Além do valor acima, o CONTRATANTE pagará ao CONTRATADO o equivalente ` +
      `a ${h.exitoPercentual}% (${h.exitoExtenso}) sobre o valor economizado ou restituído em ` +
      "decorrência de sentença, acordo ou quitação extrajudicial, incluindo abatimentos obtidos junto " +
      "à instituição financeira."
  );
  ctx.p(
    `2.3 Forma de Pagamento: O pagamento dos honorários de êxito deverá ser efetuado no prazo máximo ` +
      `de ${h.exitoPrazoDias} (${h.exitoPrazoExtenso}) dias úteis após a disponibilização do valor em ` +
      "favor do CONTRATANTE, seja por depósito judicial, acordo ou recebimento extrajudicial."
  );

  ctx.h1("CLÁUSULA 3 — DAS DESPESAS");
  ctx.p(
    "Todas as custas processuais, taxas, emolumentos, diligências de oficial de justiça, perícias, " +
      "deslocamentos e demais despesas necessárias ao regular andamento do processo correrão por conta " +
      "exclusiva do CONTRATANTE, mediante prévia solicitação do CONTRATADO, não se confundindo com os " +
      "honorários ajustados."
  );

  ctx.h1("CLÁUSULA 4 — DAS OBRIGAÇÕES DO CONTRATANTE");
  ctx.pLista([
    "a) Fornecer todos os documentos originais ou cópias legíveis indispensáveis à propositura da ação, " +
      "inclusive contrato de financiamento, comprovantes de pagamento e documentos pessoais;",
    "b) Informar qualquer mudança de endereço, telefone ou e-mail para comunicação processual;",
    "c) Cumprir pontualmente com o pagamento dos honorários e custas quando solicitados.",
  ]);

  ctx.h1("CLÁUSULA 5 — DAS OBRIGAÇÕES DO CONTRATADO");
  ctx.pLista([
    "a) Atuar com zelo, diligência e ética profissional em todas as fases do processo;",
    "b) Manter o CONTRATANTE informado sobre o andamento do processo, salvo prazos meramente " +
      "burocráticos ou atos que não alterem substancialmente o status da demanda;",
    "c) Empregar os melhores esforços técnicos e jurídicos para a defesa dos interesses do CONTRATANTE, " +
      "sem garantia de resultado, na forma do Código de Ética e Disciplina da OAB.",
  ]);

  ctx.h1("CLÁUSULA 6 — RESCISÃO");
  ctx.pLista([
    `a) Por iniciativa de qualquer das partes, mediante aviso prévio de ${h.rescisaoAvisoDias} ` +
      `(${h.rescisaoAvisoExtenso}) dias, sem prejuízo do pagamento pelos serviços já prestados;`,
    "b) Em caso de inadimplência do CONTRATANTE, ficando devidos os honorários proporcionais aos " +
      "serviços executados e, havendo resultado favorável já obtido, a totalidade dos honorários de êxito.",
  ]);

  ctx.h1("CLÁUSULA 7 — FORO");
  ctx.p(
    `Para dirimir quaisquer questões oriundas deste contrato, fica eleito o foro da Comarca de ${d.foro}, ` +
      "com renúncia a qualquer outro, por mais privilegiado que seja."
  );

  ctx.p(
    "E, por estarem justos e contratados, firmam o presente instrumento por meio de assinatura " +
      "eletrônica, que as partes expressamente reconhecem como válida e suficiente para comprovar sua " +
      "autoria e integridade, nos termos do art. 10, § 2º, da Medida Provisória nº 2.200-2/2001."
  );

  dataLocal(ctx, d.local, d.data);
  assinatura(ctx, "CONTRATANTE", d.cliente.nome, d.cliente.cpf);
}

// ── Procuração ─────────────────────────────────────────────────────────────

function renderProcuracao(ctx: PdfContext, d: DadosDocumentos) {
  ctx.h1("OUTORGANTE");
  ctx.p(`${qualificacao(d.cliente)}.`, 4);

  ctx.h1("OUTORGADOS");
  ctx.p(d.advogados.outorgados, 4);

  ctx.h1("PODERES");
  ctx.p(
    "Pelo presente instrumento particular de mandato, o(a) OUTORGANTE acima qualificado(a) nomeia e " +
      "constitui seus bastantes procuradores os OUTORGADOS acima qualificados, aos quais confere amplos " +
      'poderes para o foro em geral, com a cláusula "ad judicia et extra", para atuar perante qualquer ' +
      "Juízo, Instância ou Tribunal, podendo propor contra quem de direito as ações competentes, e " +
      "defendê-lo(a) nas contrárias, seguindo umas e outras até final decisão, usando os recursos legais " +
      "e acompanhando-os, conferindo-lhes ainda poderes especiais para confessar, desistir, transigir, " +
      "firmar compromissos ou acordos, receber e dar quitação, receber citação inicial, reconhecer a " +
      "procedência do pedido, renunciar ao direito sobre que se funda a ação, assinar declaração de " +
      "hipossuficiência econômica para fins de concessão da justiça gratuita (art. 99 do CPC), podendo " +
      "ainda substabelecer esta a outrem, com ou sem reserva de poderes, dando tudo por bom, firme e " +
      "valioso, especialmente para:",
    2
  );
  ctx.pLista([
    `a) representar o(a) OUTORGANTE perante ${d.contrato.banco} e demais instituições financeiras, ` +
      "órgãos de proteção ao crédito, Banco Central do Brasil e PROCON, podendo requerer, obter e retirar " +
      "cópias do contrato, extratos, planilhas de evolução da dívida, comprovantes de pagamento e " +
      "informações de qualquer natureza necessários à instrução do processo;",

    `b) ajuizar e acompanhar Ação Revisional do Contrato de Financiamento de Veículo nº ` +
      `${d.contrato.numero}, firmado com ${d.contrato.banco} em ${d.contrato.data}, tendo por objeto o ` +
      `veículo ${d.contrato.veiculo}, bem como ações conexas, cautelares e incidentes, inclusive ` +
      "consignação em pagamento, exibição de documentos e tutela de urgência para obstar inscrição em " +
      "cadastros restritivos e busca e apreensão do bem;",

    "c) transigir e firmar acordo com a instituição financeira, judicial ou extrajudicialmente, levantar " +
      "e dar quitação de valores restituídos ou depositados em juízo, e promover o cumprimento de " +
      "sentença, até decisão final em primeira instância ou em instância superior.",
  ]);

  dataLocal(ctx, d.local, d.data);
  assinatura(ctx, "OUTORGANTE", d.cliente.nome, d.cliente.cpf);
}

// ── Declaração de hipossuficiência ─────────────────────────────────────────

function renderDeclaracao(ctx: PdfContext, d: DadosDocumentos) {
  ctx.p(
    `Eu, ${qualificacao(d.cliente)}, DECLARO, sob as penas da lei, para fins de concessão dos ` +
      "benefícios da justiça gratuita, que:"
  );
  ctx.p(
    "Não possuo condições financeiras de arcar com as custas processuais, despesas e honorários " +
      "advocatícios da ação que pretendo ajuizar, sem prejuízo do meu sustento próprio e/ou de minha " +
      "família, nos termos do art. 99, § 3º, do Código de Processo Civil."
  );
  ctx.p(
    "Declaro, ainda, estar ciente de que a presente declaração é feita sob pena de responsabilidade " +
      "civil e criminal, nos termos do art. 299 do Código Penal, caso se comprove a falsidade das " +
      "informações aqui prestadas."
  );
  ctx.p("Por ser expressão da verdade, firmo a presente declaração.");

  dataLocal(ctx, d.local, d.data);
  assinatura(ctx, "DECLARANTE", d.cliente.nome, d.cliente.cpf);
}

// ── Montagem ───────────────────────────────────────────────────────────────

export function gerarDocumentosRevisional(d: DadosDocumentos): Buffer {
  // Escritorio.logo guarda caminho no storage, não imagem embutida. jsPDF
  // precisa de data URI — passar uma URL falharia em runtime. Enquanto não
  // houver o passo de buscar e converter o arquivo, só aceitamos data URI e
  // caímos no cabeçalho tipográfico no resto dos casos.
  const logo = d.escritorio.timbradoBase64;
  const timbrado: Timbrado = {
    imagemBase64: logo?.startsWith("data:image/jpeg") ? logo : null,
    nomeEscritorio: d.escritorio.nome,
    rodape: d.escritorio.rodape,
  };

  const ctx = criarContextoPDF(timbrado);

  ctx.desenharTimbrado();
  desenharCabecalhoDocumento(ctx, "HON");
  desenharTitulo(ctx, "CONTRATO DE HONORÁRIOS ADVOCATÍCIOS");
  renderContrato(ctx, d);

  ctx.doc.addPage();
  ctx.desenharTimbrado();
  desenharCabecalhoDocumento(ctx, "PROC");
  desenharTitulo(ctx, 'PROCURAÇÃO "AD JUDICIA ET EXTRA"');
  renderProcuracao(ctx, d);

  if (d.incluirDeclaracao) {
    ctx.doc.addPage();
    ctx.desenharTimbrado();
    desenharCabecalhoDocumento(ctx, "DECL");
    desenharTitulo(ctx, "DECLARAÇÃO DE HIPOSSUFICIÊNCIA ECONÔMICA");
    renderDeclaracao(ctx, d);
  }

  numerarPaginas(ctx);
  return Buffer.from(ctx.doc.output("arraybuffer"));
}
