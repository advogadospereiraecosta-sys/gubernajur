import jsPDF from "jspdf";

export const NAVY = [43, 58, 74] as [number, number, number];
export const GOLD = [199, 181, 126] as [number, number, number];
export const WHITE = [255, 255, 255] as [number, number, number];
export const GRAY = [91, 79, 71] as [number, number, number];

/**
 * Timbrado do escritório, em JPEG base64.
 *
 * No SaaS o timbrado é por inquilino — vem do campo `logo` do Escritorio, não
 * de um arquivo no disco. Quem chama passa o valor; sem timbrado o documento
 * sai com um cabeçalho tipográfico limpo, e não quebrado.
 *
 * O formato importa: jsPDF embute JPEG passando o stream DCT direto para o
 * PDF, mas com PNG (sem Canvas, rodando em Node) guarda um bitmap sem
 * compressão e infla um arquivo de ~100KB para dezenas de MB.
 */
export type Timbrado = {
  /** data:image/jpeg;base64,... */
  imagemBase64?: string | null;
  /** Usado quando não há imagem. */
  nomeEscritorio: string;
  rodape?: string;
};

export type PdfContext = {
  doc: jsPDF;
  W: number;
  H: number;
  y: number;
  desenharTimbrado(): void;
  /** Título de seção (fundo navy, texto branco). */
  h1(texto: string): void;
  /** Parágrafo normal, justificado. marginBottom customizável (padrão 6mm). */
  p(texto: string, marginBottom?: number): void;
  /** Lista a)/b)/c) — alinhada à esquerda (não justificada), espaçamento mais compacto. */
  pLista(itens: string[]): void;
  novaPagina(): void;
};

export function criarContextoPDF(timbrado: Timbrado): PdfContext {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const imagem = timbrado.imagemBase64;

  const ctx: PdfContext = {
    doc,
    W,
    H,
    y: 0,
    desenharTimbrado() {
      if (imagem) {
        this.doc.addImage(imagem, "JPEG", 0, 0, this.W, this.H);
        return;
      }
      // Sem imagem cadastrada: cabeçalho tipográfico, para o documento não
      // sair quebrado. Cada escritório sobe o seu em Configurações.
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(13);
      this.doc.setTextColor(...NAVY);
      this.doc.text(timbrado.nomeEscritorio.toUpperCase(), this.W / 2, 20, {
        align: "center",
      });
      this.doc.setDrawColor(...GOLD);
      this.doc.setLineWidth(0.6);
      this.doc.line(this.W / 2 - 30, 24, this.W / 2 + 30, 24);
      if (timbrado.rodape) {
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(7);
        this.doc.setTextColor(...GRAY);
        this.doc.text(timbrado.rodape, this.W / 2, this.H - 12, { align: "center" });
      }
    },
    h1(texto) {
      if (this.y > this.H - 40) this.novaPagina();
      this.doc.setFillColor(...NAVY);
      this.doc.roundedRect(14, this.y, this.W - 28, 7, 2, 2, "F");
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(...WHITE);
      this.doc.text(texto, 20, this.y + 4.8);
      this.y += 12;
    },
    p(texto, marginBottom = 6) {
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(...GRAY);
      const linhas = this.doc.splitTextToSize(texto, this.W - 28) as string[];
      const altura = linhas.length * 4.5;
      if (this.y + altura > this.H - 25) this.novaPagina();
      this.doc.text(texto, 14, this.y, { maxWidth: this.W - 28, align: "justify" });
      this.y += altura + marginBottom;
    },
    pLista(itens) {
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(...GRAY);
      for (const item of itens) {
        const linhas = this.doc.splitTextToSize(item, this.W - 34) as string[];
        const altura = linhas.length * 4.3;
        if (this.y + altura > this.H - 25) this.novaPagina();
        this.doc.text(item, 20, this.y, { maxWidth: this.W - 34, align: "left" });
        this.y += altura + 3;
      }
    },
    novaPagina() {
      this.doc.addPage();
      this.desenharTimbrado();
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(...GRAY);
      this.doc.text("Continuação", this.W / 2, 44, { align: "center" });
      this.y = 54;
    },
  };

  return ctx;
}

export function desenharTitulo(ctx: PdfContext, titulo: string) {
  ctx.y = 58;
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(13);
  ctx.doc.setTextColor(...NAVY);
  ctx.doc.text(titulo, ctx.W / 2, ctx.y, { align: "center", maxWidth: ctx.W - 40 });
  ctx.y += 4;
  ctx.doc.setDrawColor(...GOLD);
  ctx.doc.setLineWidth(0.6);
  ctx.doc.line(ctx.W / 2 - 38, ctx.y, ctx.W / 2 + 38, ctx.y);
  ctx.y += 10;
}

export function desenharCabecalhoDocumento(ctx: PdfContext, prefixo: string) {
  const numDocumento = `${prefixo}-${Date.now().toString().slice(-6)}`;
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(7.5);
  ctx.doc.setTextColor(...GRAY);
  ctx.doc.text(`Documento nº ${numDocumento}`, 14, 44);
  ctx.doc.text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")}`, ctx.W - 14, 44, { align: "right" });
}

export function numerarPaginas(ctx: PdfContext) {
  const totalPages = (ctx.doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    ctx.doc.setPage(i);
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(7);
    ctx.doc.setTextColor(...GRAY);
    ctx.doc.text(`Página ${i} de ${totalPages}`, ctx.W - 14, ctx.H - 20, { align: "right" });
  }
}

export type Endereco = {
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
};

export function montarEndereco(d: Endereco): string {
  return [
    [d.rua, d.numero || "S/N"].filter(Boolean).join(", "),
    d.complemento,
    d.bairro,
    d.cidade && d.uf ? `${d.cidade}/${d.uf}` : d.cidade,
  ]
    .filter(Boolean)
    .join(", ");
}
