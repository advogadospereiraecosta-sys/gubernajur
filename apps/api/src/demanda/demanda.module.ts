import { Module } from '@nestjs/common';
import { DemandaController } from './demanda.controller';
import { DemandaService } from './demanda.service';

@Module({
  controllers: [DemandaController],
  providers: [DemandaService],
  exports: [DemandaService],
})
export class DemandaModule {}
