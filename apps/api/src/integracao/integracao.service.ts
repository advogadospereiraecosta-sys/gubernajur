import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIntegracaoDto, UpdateIntegracaoDto } from './integracao.dto';

@Injectable()
export class IntegracaoService {
  constructor(private prisma: PrismaService) {}

  async findAll(escritorioId: string) {
    return this.prisma.integracao.findMany({
      where: { escritorioId },
      orderBy: [{ tipo: 'asc' }, { criadoEm: 'desc' }],
    });
  }

  async findOne(escritorioId: string, id: string) {
    const integracao = await this.prisma.integracao.findFirst({
      where: { id, escritorioId },
    });
    if (!integracao) throw new NotFoundException('Integração não encontrada');
    return integracao;
  }

  async create(escritorioId: string, dto: CreateIntegracaoDto) {
    return this.prisma.integracao.create({
      data: {
        escritorioId,
        tipo: dto.tipo,
        nome: dto.nome,
        status: dto.status ?? 'INATIVA',
        config: (dto.config as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  }

  async update(escritorioId: string, id: string, dto: UpdateIntegracaoDto) {
    await this.findOne(escritorioId, id);
    const data: Prisma.IntegracaoUncheckedUpdateInput = {};
    if (dto.nome !== undefined) data.nome = dto.nome;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.config !== undefined)
      data.config = dto.config as Prisma.InputJsonValue;
    return this.prisma.integracao.update({ where: { id }, data });
  }

  async ativar(escritorioId: string, id: string) {
    await this.findOne(escritorioId, id);
    return this.prisma.integracao.update({
      where: { id },
      data: { status: 'ATIVA', ultimaSincronizacao: new Date() },
    });
  }

  async desativar(escritorioId: string, id: string) {
    await this.findOne(escritorioId, id);
    return this.prisma.integracao.update({
      where: { id },
      data: { status: 'INATIVA' },
    });
  }

  async remove(escritorioId: string, id: string) {
    await this.findOne(escritorioId, id);
    await this.prisma.integracao.delete({ where: { id } });
    return { ok: true };
  }
}
