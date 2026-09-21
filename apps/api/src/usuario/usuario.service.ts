import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Funcao, Perfil } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  async findAll(escritorioId: string) {
    return this.prisma.usuario.findMany({
      where: { escritorioId, ativo: true },
      select: { id: true, nome: true, email: true, funcao: true, perfil: true, avatar: true, ultimoLogin: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(escritorioId: string, id: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id, escritorioId },
      select: { id: true, nome: true, email: true, funcao: true, perfil: true, avatar: true, telefone: true, ativo: true },
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return usuario;
  }

  async create(escritorioId: string, data: { nome: string; email: string; senha: string; funcao?: Funcao }) {
    const existente = await this.prisma.usuario.findFirst({
      where: { email: data.email, escritorioId },
    });
    if (existente) throw new BadRequestException('Email já cadastrado neste escritório');

    const senhaHash = await bcrypt.hash(data.senha, 12);

    return this.prisma.usuario.create({
      data: {
        nome: data.nome,
        email: data.email,
        senhaHash,
        funcao: data.funcao || 'ADVOGADO' as Funcao,
        escritorioId,
      },
      select: { id: true, nome: true, email: true, funcao: true },
    });
  }

  async update(
    escritorioId: string,
    id: string,
    data: { nome?: string; email?: string; telefone?: string; avatar?: string; funcao?: Funcao; perfil?: Perfil },
  ) {
    await this.prisma.usuario.updateMany({ where: { id, escritorioId }, data });
    return this.findById(escritorioId, id);
  }

  async delete(escritorioId: string, id: string) {
    return this.prisma.usuario.update({
      where: { id, escritorioId },
      data: { ativo: false },
    });
  }
}
