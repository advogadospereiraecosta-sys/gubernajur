import { Module } from '@nestjs/common';
import { AudienciaController } from './audiencia.controller';
import { AudienciaService } from './audiencia.service';

@Module({
  controllers: [AudienciaController],
  providers: [AudienciaService],
  exports: [AudienciaService],
})
export class AudienciaModule {}
