import { Module } from '@nestjs/common';
import { PrazoController } from './prazo.controller';
import { PrazoService } from './prazo.service';

@Module({
  controllers: [PrazoController],
  providers: [PrazoService],
  exports: [PrazoService],
})
export class PrazoModule {}
