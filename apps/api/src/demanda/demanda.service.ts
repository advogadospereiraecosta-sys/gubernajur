import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DemandaService {
  constructor(private prisma: PrismaService) {}

  async findAll(escritorioId: string, filters?: { responsavelId?: string; status?: string }) {
    const where: any = { escritorioId };
    if (filters?.responsavelId) where.responsavelId = filters.responsavelId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.demanda.findMany({
      where,
      include: {
        responsavel: { select: { id: true, nome: true, avatar: true } },
        processo: { select: { id: true, numeroCNJ: true } },
        _count: { select: { comentarios: true } },
      },
      orderBy: [{ prioridade: 'desc' }, { prazo: 'asc' }],
    });
  }

  async findById(escritorioId: string, id: string) {
    const demanda = await this.prisma.demanda.findUnique({
      where: { id, escritorioId },
      include: {
        responsavel: { select: { id: true, nome: true, avatar: true } },
        comentarios: { include: { usuario: { select: { id: true, nome: true, avatar: true } } }, orderBy: { createdAt: 'asc' } },
        anexos: true,
      },
    });
    if (!demanda) throw new NotFoundException('Demanda não encontrada');
    return demanda;
  }

  async create(escritorioId: string, data: any) {
    return this.prisma.demanda.create({ data: { ...data, escritorioId } });
  }

  async update(escritorioId: string, id: string, data: any) {
    return this.prisma.demanda.update({ where: { id, escritorioId }, data });
  }

  async addComment(escritorioId: string, demandaId: string, usuarioId: string, conteudo: string) {
    return this.prisma.comentario.create({ data: { demandaId, usuarioId, conteudo } });
  }

  async delete(escritorioId: string, id: string) {
    return this.prisma.demanda.delete({ where: { id, escritorioId } });
  }

  async getStats(escritorioId: string) {
    const [total, aFazer, emAndamento, concluidas] = await Promise.all([
      this.prisma.demanda.count({ where: { escritorioId } }),
      this.prisma.demanda.count({ where: { escritorioId, status: 'A_FAZER' } }),
      this.prisma.demanda.count({ where: { escritorioId, status: 'EM_ANDAMENTO' } }),
      this.prisma.demanda.count({ where: { escritorioId, status: 'CONCLUIDO' } }),
    ]);
    return { total, aFazer, emAndamento, concluidas };
  }
}
