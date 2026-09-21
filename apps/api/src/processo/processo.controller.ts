import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProcessoService } from './processo.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('processos')
@UseGuards(JwtAuthGuard)
export class ProcessoController {
  constructor(private processo: ProcessoService) {}

  @Get()
  findAll(
    @CurrentUser('escritorioId') escritorioId: string,
    @Query('search') search?: string,
    @Query('fase') fase?: string,
    @Query('area') area?: string,
  ) {
    return this.processo.findAll(escritorioId, { search, fase, area });
  }

  @Get('stats')
  getStats(@CurrentUser('escritorioId') escritorioId: string) {
    return this.processo.getStats(escritorioId);
  }

  @Get(':id')
  findOne(@CurrentUser('escritorioId') escritorioId: string, @Param('id') id: string) {
    return this.processo.findById(escritorioId, id);
  }

  @Post()
  create(@CurrentUser('escritorioId') escritorioId: string, @Body() body: any) {
    return this.processo.create(escritorioId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser('escritorioId') escritorioId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.processo.update(escritorioId, id, body);
  }

  @Delete(':id')
  delete(@CurrentUser('escritorioId') escritorioId: string, @Param('id') id: string) {
    return this.processo.delete(escritorioId, id);
  }
}
