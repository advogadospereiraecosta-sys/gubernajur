import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PrazoService } from './prazo.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('prazos')
@UseGuards(JwtAuthGuard)
export class PrazoController {
  constructor(private prazo: PrazoService) {}

  @Get()
  findAll(
    @CurrentUser('escritorioId') escritorioId: string,
    @Query('processoId') processoId?: string,
    @Query('status') status?: string,
  ) {
    return this.prazo.findAll(escritorioId, { processoId, status });
  }

  @Get('vencendo')
  getVencendo(@CurrentUser('escritorioId') escritorioId: string, @Query('dias') dias?: string) {
    return this.prazo.getVencendo(escritorioId, dias ? parseInt(dias) : 7);
  }

  @Post()
  create(@CurrentUser('escritorioId') escritorioId: string, @Body() body: any) {
    return this.prazo.create(escritorioId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser('escritorioId') escritorioId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.prazo.update(escritorioId, id, body);
  }

  @Delete(':id')
  delete(@CurrentUser('escritorioId') escritorioId: string, @Param('id') id: string) {
    return this.prazo.delete(escritorioId, id);
  }
}
