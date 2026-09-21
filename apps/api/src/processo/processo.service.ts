import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProcessoService {
  constructor(private prisma: PrismaService) {}

  async findAll(escritorioId: string, filters?: { search?: string; fase?: string; area?: string }) {
    const where: any = { escritorioId };
    if (filters?.search) {
      where.OR = [
        { numeroCNJ: { contains: filters.search } },
        { classe: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters?.fase) where.fase = filters.fase;
    if (filters?.area) where.area = filters.area;

    return this.prisma.processo.findMany({
      where,
      include: { cliente: { select: { id: true, nome: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(escritorioId: string, id: string) {
    const processo = await this.prisma.processo.findUnique({
      where: { id, escritorioId },
      include: {
        cliente: true,
        demandas: { take: 5, orderBy: { createdAt: 'desc' } },
        audiencias: { orderBy: { dataHora: 'desc' }, take: 3 },
      },
    });
    if (!processo) throw new NotFoundException('Processo não encontrado');
    return processo;
  }

  async create(escritorioId: string, data: any) {
    const { numero, dataAjuizamento, dataDistribuicao, orgaoJulgador, tribunal, ...rest } = data ?? {};
    return this.prisma.processo.create({
      data: {
        ...rest,
        escritorioId,
        ...(numero ? { numeroCNJ: numero } : {}),
        orgaoJulgador: orgaoJulgador ?? 'A definir',
        tribunal: tribunal ?? 'A definir',
        dataAjuizamento: dataAjuizamento ? new Date(dataAjuizamento) : new Date(),
        dataDistribuicao: dataDistribuicao ? new Date(dataDistribuicao) : new Date(),
      },
      include: { cliente: { select: { id: true, nome: true } } },
    });
  }

  async update(escritorioId: string, id: string, data: any) {
    const { numero, ...rest } = data ?? {};
    const updateData: any = { ...rest };
    if (numero) updateData.numeroCNJ = numero;
    return this.prisma.processo.update({
      where: { id, escritorioId },
      data: updateData,
    });
  }

  async delete(escritorioId: string, id: string) {
    return this.prisma.processo.delete({ where: { id, escritorioId } });
  }

  async getStats(escritorioId: string) {
    const [total, porFase] = await Promise.all([
      this.prisma.processo.count({ where: { escritorioId } }),
      this.prisma.processo.groupBy({
        by: ['fase'],
        where: { escritorioId },
        _count: true,
      }),
    ]);
    return { total, porFase: porFase.map(f => ({ fase: f.fase, count: f._count })) };
  }
}
