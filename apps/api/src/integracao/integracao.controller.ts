import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IntegracaoService } from './integracao.service';
import { CreateIntegracaoDto, UpdateIntegracaoDto } from './integracao.dto';

@Controller('integracoes')
@UseGuards(JwtAuthGuard)
export class IntegracaoController {
  constructor(private service: IntegracaoService) {}

  @Get()
  findAll(@CurrentUser('escritorioId') escritorioId: string) {
    return this.service.findAll(escritorioId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('escritorioId') escritorioId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOne(escritorioId, id);
  }

  @Post()
  create(
    @CurrentUser('escritorioId') escritorioId: string,
    @Body() dto: CreateIntegracaoDto,
  ) {
    return this.service.create(escritorioId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('escritorioId') escritorioId: string,
    @Param('id') id: string,
    @Body() dto: UpdateIntegracaoDto,
  ) {
    return this.service.update(escritorioId, id, dto);
  }

  @Post(':id/ativar')
  ativar(
    @CurrentUser('escritorioId') escritorioId: string,
    @Param('id') id: string,
  ) {
    return this.service.ativar(escritorioId, id);
  }

  @Post(':id/desativar')
  desativar(
    @CurrentUser('escritorioId') escritorioId: string,
    @Param('id') id: string,
  ) {
    return this.service.desativar(escritorioId, id);
  }

  @Delete(':id')
  remove(
    @CurrentUser('escritorioId') escritorioId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(escritorioId, id);
  }
}
