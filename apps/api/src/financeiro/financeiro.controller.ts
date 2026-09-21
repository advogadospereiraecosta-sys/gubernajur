import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('financeiro')
@UseGuards(JwtAuthGuard)
export class FinanceiroController {
  constructor(private financeiro: FinanceiroService) {}

  @Get()
  findAll(
    @CurrentUser('escritorioId') escritorioId: string,
    @Query('tipo') tipo?: string,
    @Query('status') status?: string,
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    return this.financeiro.findAll(escritorioId, {
      tipo,
      status,
      mes: mes ? parseInt(mes) : undefined,
      ano: ano ? parseInt(ano) : undefined,
    });
  }

  @Get('resumo')
  getResumo(
    @CurrentUser('escritorioId') escritorioId: string,
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    return this.financeiro.getResumo(
      escritorioId,
      mes ? parseInt(mes) : undefined,
      ano ? parseInt(ano) : undefined,
    );
  }

  @Post()
  create(@CurrentUser('escritorioId') escritorioId: string, @Body() body: any) {
    return this.financeiro.create(escritorioId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser('escritorioId') escritorioId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.financeiro.update(escritorioId, id, body);
  }

  @Delete(':id')
  delete(@CurrentUser('escritorioId') escritorioId: string, @Param('id') id: string) {
    return this.financeiro.delete(escritorioId, id);
  }
}
