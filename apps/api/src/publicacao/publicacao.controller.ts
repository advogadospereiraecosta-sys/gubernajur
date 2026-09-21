import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PublicacaoService } from './publicacao.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('publicacoes')
@UseGuards(JwtAuthGuard)
export class PublicacaoController {
  constructor(private publicacao: PublicacaoService) {}

  @Get()
  findAll(
    @CurrentUser('escritorioId') escritorioId: string,
    @Query('processoId') processoId?: string,
    @Query('lida') lida?: string,
    @Query('urgencia') urgencia?: string,
  ) {
    return this.publicacao.findAll(escritorioId, {
      processoId,
      lida: lida !== undefined ? lida === 'true' : undefined,
      urgencia,
    });
  }

  @Get('stats')
  getStats(@CurrentUser('escritorioId') escritorioId: string) {
    return this.publicacao.getStats(escritorioId);
  }

  @Get('nao-lidas')
  getNaoLidas(@CurrentUser('escritorioId') escritorioId: string) {
    return this.publicacao.getNaoLidas(escritorioId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('escritorioId') escritorioId: string,
    @Param('id') id: string,
  ) {
    return this.publicacao.findById(escritorioId, id);
  }

  @Post()
  create(
    @CurrentUser('escritorioId') escritorioId: string,
    @Body() body: {
      processoId: string;
      tribunal: string;
      tipo: string;
      conteudo: string;
      dataPublicacao: string;
      paginaDiario?: number;
    },
  ) {
    return this.publicacao.create(escritorioId, {
      ...body,
      dataPublicacao: new Date(body.dataPublicacao),
    });
  }

  /** Triar uma publicação (re-parse com IA) */
  @Post(':id/triar')
  triar(
    @CurrentUser('escritorioId') escritorioId: string,
    @Param('id') id: string,
    @Body() body: { observacoes?: string },
  ) {
    return this.publicacao.triar(escritorioId, id, body.observacoes);
  }

  /** Triar múltiplas publicações em lote */
  @Post('triar-lote')
  triarLote(
    @CurrentUser('escritorioId') escritorioId: string,
    @Body() body: { ids: string[] },
  ) {
    return this.publicacao.triarEmLote(escritorioId, body.ids);
  }

  @Patch(':id/ler')
  marcarLida(
    @CurrentUser('escritorioId') escritorioId: string,
    @Param('id') id: string,
  ) {
    return this.publicacao.marcarLida(escritorioId, id);
  }

  @Delete(':id')
  delete(
    @CurrentUser('escritorioId') escritorioId: string,
    @Param('id') id: string,
  ) {
    return this.publicacao.delete(escritorioId, id);
  }
}
