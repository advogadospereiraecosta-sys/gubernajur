import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AudienciaService } from './audiencia.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('audiencias')
@UseGuards(JwtAuthGuard)
export class AudienciaController {
  constructor(private audiencia: AudienciaService) {}

  @Get()
  findAll(
    @CurrentUser('escritorioId') escritorioId: string,
    @Query('processoId') processoId?: string,
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    return this.audiencia.findAll(escritorioId, {
      processoId,
      mes: mes ? parseInt(mes) : undefined,
      ano: ano ? parseInt(ano) : undefined,
    });
  }

  @Get('proximas')
  getProximas(@CurrentUser('escritorioId') escritorioId: string, @Query('limit') limit?: string) {
    return this.audiencia.getProximas(escritorioId, limit ? parseInt(limit) : 5);
  }

  @Get(':id')
  findOne(@CurrentUser('escritorioId') escritorioId: string, @Param('id') id: string) {
    return this.audiencia.findById(escritorioId, id);
  }

  @Post()
  create(@CurrentUser('escritorioId') escritorioId: string, @Body() body: any) {
    return this.audiencia.create(escritorioId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser('escritorioId') escritorioId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.audiencia.update(escritorioId, id, body);
  }

  @Delete(':id')
  delete(@CurrentUser('escritorioId') escritorioId: string, @Param('id') id: string) {
    return this.audiencia.delete(escritorioId, id);
  }
}
