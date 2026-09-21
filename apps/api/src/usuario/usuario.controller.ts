import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuarioController {
  constructor(private usuario: UsuarioService) {}

  @Get()
  findAll(@CurrentUser('escritorioId') escritorioId: string) {
    return this.usuario.findAll(escritorioId);
  }

  @Get('me')
  me(@CurrentUser('id') userId: string, @CurrentUser('escritorioId') escritorioId: string) {
    return this.usuario.findById(escritorioId, userId);
  }

  @Patch('me')
  updateMe(
    @CurrentUser('id') userId: string,
    @CurrentUser('escritorioId') escritorioId: string,
    @Body() body: { nome?: string; email?: string; telefone?: string; avatar?: string },
  ) {
    return this.usuario.update(escritorioId, userId, body as any);
  }

  @Get(':id')
  findOne(@CurrentUser('escritorioId') escritorioId: string, @Param('id') id: string) {
    return this.usuario.findById(escritorioId, id);
  }

  @Post()
  create(
    @CurrentUser('escritorioId') escritorioId: string,
    @Body() body: { nome: string; email: string; senha: string; funcao?: string },
  ) {
    return this.usuario.create(escritorioId, body as any);
  }

  @Patch(':id')
  update(
    @CurrentUser('escritorioId') escritorioId: string,
    @Param('id') id: string,
    @Body() body: { nome?: string; email?: string; telefone?: string; funcao?: string; perfil?: string; avatar?: string },
  ) {
    return this.usuario.update(escritorioId, id, body as any);
  }

  @Delete(':id')
  delete(@CurrentUser('escritorioId') escritorioId: string, @Param('id') id: string) {
    return this.usuario.delete(escritorioId, id);
  }
}
