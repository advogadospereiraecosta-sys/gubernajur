import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrazoService {
  constructor(private prisma: PrismaService) {}

  async findAll(escritorioId: string, filters?: { processoId?: string; status?: string }) {
    const where: any = { escritorioId };
    if (filters?.processoId) where.processoId = filters.processoId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.prazo.findMany({
      where,
      include: {
        processo: { select: { id: true, numeroCNJ: true } },
      },
      orderBy: { dataFinal: 'asc' },
    });
  }

  async create(escritorioId: string, data: any) {
    const { titulo, dataVencimento, dataFinal, ...rest } = data ?? {};
    return this.prisma.prazo.create({
      data: {
        ...rest,
        escritorioId,
        descricao: titulo ?? data?.descricao ?? 'Prazo',
        ...(dataFinal
          ? { dataFinal: new Date(dataFinal) }
          : dataVencimento
          ? { dataFinal: new Date(dataVencimento) }
          : {}),
      },
    });
  }

  async update(escritorioId: string, id: string, data: any) {
    const { titulo, dataVencimento, ...rest } = data ?? {};
    const updateData: any = { ...rest };
    if (titulo) updateData.descricao = titulo;
    if (dataVencimento) updateData.dataFinal = new Date(dataVencimento);
    return this.prisma.prazo.update({ where: { id, escritorioId }, data: updateData });
  }

  async delete(escritorioId: string, id: string) {
    return this.prisma.prazo.delete({ where: { id, escritorioId } });
  }

  async getVencendo(escritorioId: string, dias = 7) {
    const now = new Date();
    const future = new Date(now.getTime() + dias * 24 * 60 * 60 * 1000);
    return this.prisma.prazo.findMany({
      where: {
        escritorioId,
        status: 'ATIVO',
        dataFinal: { gte: now, lte: future },
      },
      include: { processo: { select: { id: true, numeroCNJ: true } } },
      orderBy: { dataFinal: 'asc' },
    });
  }
}
