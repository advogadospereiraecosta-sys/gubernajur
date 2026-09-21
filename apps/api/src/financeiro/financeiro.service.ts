import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceiroService {
  constructor(private prisma: PrismaService) {}

  async findAll(escritorioId: string, filters?: { tipo?: string; status?: string; mes?: number; ano?: number }) {
    const where: any = { escritorioId };
    if (filters?.tipo) where.tipo = filters.tipo;
    if (filters?.status) where.status = filters.status;
    if (filters?.mes && filters?.ano) {
      const start = new Date(filters.ano, filters.mes - 1, 1);
      const end = new Date(filters.ano, filters.mes, 0, 23, 59, 59);
      where.dataVencimento = { gte: start, lte: end };
    }

    return this.prisma.financeiro.findMany({
      where,
      include: { cliente: { select: { id: true, nome: true } } },
      orderBy: { dataVencimento: 'desc' },
    });
  }

  async create(escritorioId: string, data: any) {
    const { dataVencimento, dataPagamento, ...rest } = data ?? {};
    return this.prisma.financeiro.create({
      data: {
        ...rest,
        escritorioId,
        categoria: data?.categoria ?? (data?.tipo === 'DESPESA' ? 'OUTRA_DESPESA' : 'HONORARIOS'),
        ...(dataVencimento ? { dataVencimento: new Date(dataVencimento) } : { dataVencimento: new Date() }),
        ...(dataPagamento ? { dataPagamento: new Date(dataPagamento) } : {}),
      },
    });
  }

  async update(escritorioId: string, id: string, data: any) {
    const { dataVencimento, dataPagamento, ...rest } = data ?? {};
    const updateData: any = { ...rest };
    if (dataVencimento) updateData.dataVencimento = new Date(dataVencimento);
    if (dataPagamento) updateData.dataPagamento = new Date(dataPagamento);
    return this.prisma.financeiro.update({ where: { id, escritorioId }, data: updateData });
  }

  async delete(escritorioId: string, id: string) {
    return this.prisma.financeiro.delete({ where: { id, escritorioId } });
  }

  async getResumo(escritorioId: string, mes?: number, ano?: number) {
    const where: any = { escritorioId };
    if (mes && ano) {
      const start = new Date(ano, mes - 1, 1);
      const end = new Date(ano, mes, 0, 23, 59, 59);
      where.dataVencimento = { gte: start, lte: end };
    }

    const [receitas, despesas, pendentes] = await Promise.all([
      this.prisma.financeiro.aggregate({ where: { ...where, tipo: 'RECEITA' }, _sum: { valor: true } }),
      this.prisma.financeiro.aggregate({ where: { ...where, tipo: 'DESPESA' }, _sum: { valor: true } }),
      this.prisma.financeiro.count({ where: { ...where, status: { in: ['PENDENTE', 'VENCIDO'] } } }),
    ]);

    return {
      receitas: Number(receitas._sum.valor) || 0,
      despesas: Number(despesas._sum.valor) || 0,
      saldo: (Number(receitas._sum.valor) || 0) - (Number(despesas._sum.valor) || 0),
      pendentes,
    };
  }
}
