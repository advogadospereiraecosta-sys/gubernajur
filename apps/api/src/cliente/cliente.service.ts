import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClienteService {
  constructor(private prisma: PrismaService) {}

  async findAll(escritorioId: string, search?: string) {
    return this.prisma.cliente.findMany({
      where: {
        escritorioId,
        OR: search ? [
          { nome: { contains: search, mode: 'insensitive' } },
          { cpfCnpj: { contains: search } },
        ] : undefined,
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(escritorioId: string, id: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: { processos: { select: { id: true, numeroCNJ: true } } },
    });
    if (!cliente || cliente.escritorioId !== escritorioId) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return cliente;
  }

  async create(escritorioId: string, data: any) {
    const { tipo, ...rest } = data ?? {};
    return this.prisma.cliente.create({
      data: {
        ...rest,
        escritorioId,
        ...(tipo ? { tipoPessoa: tipo } : {}),
      },
    });
  }

  async update(escritorioId: string, id: string, data: any) {
    const { tipo, ...rest } = data ?? {};
    const updateData: any = { ...rest };
    if (tipo) updateData.tipoPessoa = tipo;
    return this.prisma.cliente.update({
      where: { id, escritorioId },
      data: updateData,
    });
  }

  async delete(escritorioId: string, id: string) {
    return this.prisma.cliente.delete({ where: { id, escritorioId } });
  }
}
