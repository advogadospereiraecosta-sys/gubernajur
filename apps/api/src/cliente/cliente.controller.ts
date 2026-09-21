import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ClienteService } from './cliente.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClienteController {
  constructor(private cliente: ClienteService) {}

  @Get()
  findAll(
    @CurrentUser('escritorioId') escritorioId: string,
    @Query('search') search?: string,
  ) {
    return this.cliente.findAll(escritorioId, search);
  }

  @Get(':id')
  findOne(@CurrentUser('escritorioId') escritorioId: string, @Param('id') id: string) {
    return this.cliente.findById(escritorioId, id);
  }

  @Post()
  create(@CurrentUser('escritorioId') escritorioId: string, @Body() body: any) {
    return this.cliente.create(escritorioId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser('escritorioId') escritorioId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.cliente.update(escritorioId, id, body);
  }

  @Delete(':id')
  delete(@CurrentUser('escritorioId') escritorioId: string, @Param('id') id: string) {
    return this.cliente.delete(escritorioId, id);
  }
}
