import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PublicationParserService } from './publication-parser.service';

@Injectable()
export class PublicacaoService {
  constructor(
    private prisma: PrismaService,
    private parser: PublicationParserService,
  ) {}

  async findAll(escritorioId: string, filters?: {
    processoId?: string;
    lida?: boolean;
    urgencia?: string;
  }) {
    const where: any = { escritorioId };
    if (filters?.processoId) where.processoId = filters.processoId;
    if (filters?.lida !== undefined) where.lida = filters.lida;
    if (filters?.urgencia) where.urgencia = filters.urgencia;

    return this.prisma.publicacao.findMany({
      where,
      include: {
        processo: { select: { id: true, numeroCNJ: true } },
      },
      orderBy: { dataPublicacao: 'desc' },
      take: 50,
    });
  }

  async findById(escritorioId: string, id: string) {
    const pub = await this.prisma.publicacao.findFirst({
      where: { id, escritorioId },
      include: { processo: true },
    });
    if (!pub) throw new NotFoundException('Publicação não encontrada');
    return pub;
  }

  /**
   * Cria publicação com parse IA automático
   */
  async create(escritorioId: string, data: {
    processoId: string;
    tribunal: string;
    tipo: string;
    conteudo: string;
    dataPublicacao: Date;
    paginaDiario?: number;
    hash?: string;
  }) {
    // Deduplicação por hash
    if (data.hash) {
      const existente = await this.prisma.publicacao.findFirst({
        where: { escritorioId, processoId: data.processoId, hash: data.hash } as any,
      });
      if (existente) return existente;
    }

    // Parse IA
    const parseResult = await this.parser.parse(
      data.conteudo,
      data.tribunal,
      data.tipo,
    );

    // Fallback se IA falhar
    const parsed = parseResult ?? this.parser.parseFallback(data.conteudo);

    const pub = await this.prisma.publicacao.create({
      data: {
        escritorioId,
        processoId: data.processoId,
        tribunal: data.tribunal,
        tipo: data.tipo,
        conteudo: data.conteudo,
        dataPublicacao: data.dataPublicacao,
        paginaDiario: data.paginaDiario,
        hash: data.hash ?? this.generateHash(data.conteudo),
        urgencia: parsed.urgencia as any,
        // Parser retorna "clasificacao" (sem acento), Prisma espera "classificacao" (com acento)
        classificacao: ((parsed as any).clasificacao ?? (parsed as any).clasificacion ?? null) as any,
        itensExtraidos: parsed.itens as any,
        resumenIA: ((parsed as any).resumen ?? (parsed as any).resumenIA ?? null) as any,
        confianzaIA: ((parsed as any).confianza ?? (parsed as any).confianzaIA ?? null) as any,
      } as any,
      include: { processo: true },
    });

    return pub;
  }

  /**
   * Triar publicação manualmente (re-parse com IA)
   */
  async triar(escritorioId: string, id: string, observacoes?: string) {
    const pub = await this.findById(escritorioId, id);

    // Não tenta re-parse se já foi parseado com alta confiança
    const pubTyped = pub as any;
    if (pubTyped.confianzaIA && pubTyped.confianzaIA >= 0.9) {
      return this.prisma.publicacao.update({
        where: { id },
        data: {
          lida: true,
          triadaEm: new Date(),
          observacoes: observacoes ?? pub.observacoes,
        },
      });
    }

    // Re-parse com IA
    const parseResult = await this.parser.parse(pub.conteudo, pub.tribunal, pub.tipo);
    const parsed = parseResult ?? pubTyped;

    return this.prisma.publicacao.update({
      where: { id },
      data: {
        urgencia: ((parseResult as any)?.urgencia ?? pubTyped.urgencia) as any,
        classificacao: ((parseResult as any)?.clasificacao ?? pubTyped.classificacao) as any,
        itensExtraidos: ((parseResult as any)?.itens ?? pubTyped.itensExtraidos) as any,
        resumenIA: ((parseResult as any)?.resumen ?? pubTyped.resumenIA) as any,
        confianzaIA: ((parseResult as any)?.confianza ?? pubTyped.confianzaIA) as any,
        lida: true,
        triadaEm: new Date(),
        observacoes: observacoes ?? pub.observacoes,
      } as any,
    });
  }

  /**
   * Triar em lote — útil para processar publicações pendentes
   */
  async triarEmLote(escritorioId: string, ids: string[]) {
    const resultados: any[] = []
    for (const id of ids) {
      try {
        const result = await this.triar(escritorioId, id)
        resultados.push({ id, sucesso: true, data: result })
      } catch (e: any) {
        resultados.push({ id, sucesso: false, erro: e.message })
      }
    }
    return resultados
  }

  /**
   * Estatísticas de publicações por urgência
   */
  async getStats(escritorioId: string) {
    const [total, naoLidas, porUrgencia] = await Promise.all([
      this.prisma.publicacao.count({ where: { escritorioId } }),
      this.prisma.publicacao.count({ where: { escritorioId, lida: false } }),
      this.prisma.publicacao.groupBy({
        by: ['urgencia'] as any,
        where: { escritorioId },
        _count: { urgencia: true } as any,
      }),
    ])

    const urgenciaMap: Record<string, number> = {}
    for (const row of porUrgencia) {
      urgenciaMap[row.urgencia as string] = (row._count as any)?.urgencia ?? 0
    }

    return {
      total,
      naoLidas,
      porUrgencia: urgenciaMap,
      urgente: urgenciaMap['URGENTE'] || 0,
      alta: urgenciaMap['ALTA'] || 0,
      normal: urgenciaMap['NORMAL'] || 0,
      baixa: urgenciaMap['BAIXA'] || 0,
    }
  }

  async marcarLida(escritorioId: string, id: string) {
    return this.prisma.publicacao.update({
      where: { id, escritorioId },
      data: { lida: true, triadaEm: new Date() },
    });
  }

  async getNaoLidas(escritorioId: string) {
    return this.prisma.publicacao.count({
      where: { escritorioId, lida: false },
    });
  }

  async delete(escritorioId: string, id: string) {
    await this.findById(escritorioId, id)
    return this.prisma.publicacao.delete({ where: { id } })
  }

  private generateHash(conteudo: string): string {
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(conteudo).digest('hex').substring(0, 32)
  }
}
