import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { Funcao, Perfil } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Verificar CNPJ duplicado
    if (dto.cnpj) {
      const existente = await this.prisma.escritorio.findUnique({
        where: { cnpj: dto.cnpj },
      });
      if (existente) throw new BadRequestException('CNPJ já cadastrado');
    }

    // Verificar email duplicado em qualquer escritório ativo
    const emailExistente = await this.prisma.usuario.findFirst({
      where: { email: dto.email, ativo: true },
      include: { escritorio: { select: { nome: true } } },
    });
    if (emailExistente) {
      throw new BadRequestException(
        `Email já cadastrado no escritório "${emailExistente.escritorio.nome}"`,
      );
    }

    const senhaHash = await bcrypt.hash(dto.senha, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const escritorio = await tx.escritorio.create({
        data: { nome: dto.nomeEscritorio, cnpj: dto.cnpj || null },
      });

      await tx.configuracao.create({
        data: { escritorioId: escritorio.id },
      });

      const usuario = await tx.usuario.create({
        data: {
          email: dto.email,
          senhaHash,
          nome: dto.nome,
          funcao: 'ADMIN' as Funcao,
          perfil: 'ADMIN' as Perfil,
          escritorioId: escritorio.id,
        },
      });

      return { escritorio, usuario };
    });

    const token = this.generateToken(result.usuario.id, result.usuario.escritorioId, result.usuario.email);

    return {
      token,
      user: {
        id: result.usuario.id,
        nome: result.usuario.nome,
        email: result.usuario.email,
        escritorio: { id: result.escritorio.id, nome: result.escritorio.nome },
      },
    };
  }

  async login(dto: LoginDto) {
    // Busca por email sem escritorioId (não existe unique só em email)
    const usuario = await this.prisma.usuario.findFirst({
      where: { email: dto.email, ativo: true },
      include: { escritorio: { select: { id: true, nome: true, plano: true } } },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const senhaValida = await bcrypt.compare(dto.senha, usuario.senhaHash);
    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() },
    });

    const token = this.generateToken(usuario.id, usuario.escritorioId, usuario.email);

    return {
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        funcao: usuario.funcao,
        escritorio: usuario.escritorio,
      },
    };
  }

  async getProfile(userId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { escritorio: { select: { id: true, nome: true, plano: true, cnpj: true } } },
    });

    if (!usuario) throw new UnauthorizedException('Usuário não encontrado');

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      funcao: usuario.funcao,
      perfil: usuario.perfil,
      avatar: usuario.avatar,
      escritorio: usuario.escritorio,
    };
  }

  /**
   * Troca uma sessão validada do NextAuth por um JWT do backend.
   * Seguro porque valida que o usuário existe, está ativo e pertence ao escritório.
   * Usado pelo frontend para acessar a API a partir de Server Components.
   */
  async exchangeSession(userId: string, escritorioId: string, email: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: userId, escritorioId, email, ativo: true },
    });
    if (!usuario) throw new UnauthorizedException('Sessão inválida');
    return { accessToken: this.generateToken(usuario.id, usuario.escritorioId, usuario.email) };
  }

  private generateToken(userId: string, escritorioId: string, email: string) {
    return this.jwt.sign({ sub: userId, escritorioId, email });
  }
}
