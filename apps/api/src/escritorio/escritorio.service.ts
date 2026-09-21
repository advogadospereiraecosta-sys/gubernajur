import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EscritorioService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const escritorio = await this.prisma.escritorio.findUnique({ where: { id } });
    if (!escritorio) throw new NotFoundException('Escritório não encontrado');
    return escritorio;
  }

  async update(id: string, data: { nome?: string; telefone?: string; email?: string; endereco?: string }) {
    return this.prisma.escritorio.update({ where: { id }, data });
  }

  async getStats(escritorioId: string) {
    const [usuarios, clientes, processos, demandas] = await Promise.all([
      this.prisma.usuario.count({ where: { escritorioId } }),
      this.prisma.cliente.count({ where: { escritorioId } }),
      this.prisma.processo.count({ where: { escritorioId } }),
      this.prisma.demanda.count({ where: { escritorioId } }),
    ]);
    return { usuarios, clientes, processos, demandas };
  }
}
