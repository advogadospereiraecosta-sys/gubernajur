import { Module } from '@nestjs/common';
import { PublicacaoController } from './publicacao.controller';
import { PublicacaoService } from './publicacao.service';
import { PublicationParserService } from './publication-parser.service';

@Module({
  controllers: [PublicacaoController],
  providers: [PublicacaoService, PublicationParserService],
  exports: [PublicacaoService],
})
export class PublicacaoModule {}
