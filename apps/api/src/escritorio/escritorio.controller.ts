import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { EscritorioService } from './escritorio.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('escritorios')
@UseGuards(JwtAuthGuard)
export class EscritorioController {
  constructor(private escritorio: EscritorioService) {}

  @Get('me')
  getMe(@CurrentUser('escritorioId') escritorioId: string) {
    return this.escritorio.findById(escritorioId);
  }

  @Get('me/stats')
  getStats(@CurrentUser('escritorioId') escritorioId: string) {
    return this.escritorio.getStats(escritorioId);
  }

  @Patch('me')
  update(
    @CurrentUser('escritorioId') escritorioId: string,
    @Body() body: { nome?: string; telefone?: string; email?: string; endereco?: string },
  ) {
    return this.escritorio.update(escritorioId, body);
  }
}
