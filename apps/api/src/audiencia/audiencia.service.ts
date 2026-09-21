import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AudienciaService {
  constructor(private prisma: PrismaService) {}

  async findAll(escritorioId: string, filters?: { processoId?: string; mes?: number; ano?: number }) {
    const where: any = { escritorioId };
    if (filters?.processoId) where.processoId = filters.processoId;
    if (filters?.mes && filters?.ano) {
      const start = new Date(filters.ano, filters.mes - 1, 1);
      const end = new Date(filters.ano, filters.mes, 0);
      where.dataHora = { gte: start, lte: end };
    }

    return this.prisma.audiencia.findMany({
      where,
      include: {
        processo: { select: { id: true, numeroCNJ: true, cliente: { select: { nome: true } } } },
        responsavel: { select: { id: true, nome: true, avatar: true } },
      },
      orderBy: { dataHora: 'asc' },
    });
  }

  async findById(escritorioId: string, id: string) {
    const audiencia = await this.prisma.audiencia.findUnique({
      where: { id, escritorioId },
      include: {
        processo: { include: { cliente: true } },
        responsavel: { select: { id: true, nome: true, avatar: true } },
      },
    });
    if (!audiencia) throw new NotFoundException('Audiência não encontrada');
    return audiencia;
  }

  async create(escritorioId: string, data: any) {
    const { status, ...rest } = data ?? {};
    return this.prisma.audiencia.create({
      data: {
        ...rest,
        escritorioId,
        ...(typeof data?.dataHora === 'string' ? { dataHora: new Date(data.dataHora) } : {}),
      },
    });
  }

  async update(escritorioId: string, id: string, data: any) {
    const { status, ...rest } = data ?? {};
    return this.prisma.audiencia.update({
      where: { id, escritorioId },
      data: {
        ...rest,
        ...(typeof data?.dataHora === 'string' ? { dataHora: new Date(data.dataHora) } : {}),
      },
    });
  }

  async delete(escritorioId: string, id: string) {
    return this.prisma.audiencia.delete({ where: { id, escritorioId } });
  }

  async getProximas(escritorioId: string, limit = 5) {
    return this.prisma.audiencia.findMany({
      where: { escritorioId, dataHora: { gte: new Date() } },
      include: {
        processo: { select: { id: true, numeroCNJ: true } },
        responsavel: { select: { id: true, nome: true } },
      },
      orderBy: { dataHora: 'asc' },
      take: limit,
    });
  }
}
