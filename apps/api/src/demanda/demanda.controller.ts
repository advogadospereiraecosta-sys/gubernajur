import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DemandaService } from './demanda.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('demandas')
@UseGuards(JwtAuthGuard)
export class DemandaController {
  constructor(private demanda: DemandaService) {}

  @Get()
  findAll(
    @CurrentUser('escritorioId') escritorioId: string,
    @Query('responsavelId') responsavelId?: string,
    @Query('status') status?: string,
  ) {
    return this.demanda.findAll(escritorioId, { responsavelId, status });
  }

  @Get('stats')
  getStats(@CurrentUser('escritorioId') escritorioId: string) {
    return this.demanda.getStats(escritorioId);
  }

  @Get(':id')
  findOne(@CurrentUser('escritorioId') escritorioId: string, @Param('id') id: string) {
    return this.demanda.findById(escritorioId, id);
  }

  @Post()
  create(@CurrentUser('escritorioId') escritorioId: string, @Body() body: any) {
    return this.demanda.create(escritorioId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser('escritorioId') escritorioId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.demanda.update(escritorioId, id, body);
  }

  @Post(':id/comentarios')
  addComment(
    @CurrentUser('escritorioId') escritorioId: string,
    @Param('id') id: string,
    @Body() body: { conteudo: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.demanda.addComment(escritorioId, id, userId, body.conteudo);
  }

  @Delete(':id')
  delete(@CurrentUser('escritorioId') escritorioId: string, @Param('id') id: string) {
    return this.demanda.delete(escritorioId, id);
  }
}
