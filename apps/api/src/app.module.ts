import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { EscritorioModule } from './escritorio/escritorio.module';
import { UsuarioModule } from './usuario/usuario.module';
import { ClienteModule } from './cliente/cliente.module';
import { ProcessoModule } from './processo/processo.module';
import { DemandaModule } from './demanda/demanda.module';
import { AudienciaModule } from './audiencia/audiencia.module';
import { PrazoModule } from './prazo/prazo.module';
import { FinanceiroModule } from './financeiro/financeiro.module';
import { PublicacaoModule } from './publicacao/publicacao.module';
import { IntegracaoModule } from './integracao/integracao.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'C:/Users/davi9/gubernajur/.env',
    }),
    PrismaModule,
    AuthModule,
    EscritorioModule,
    UsuarioModule,
    ClienteModule,
    ProcessoModule,
    DemandaModule,
    AudienciaModule,
    PrazoModule,
    FinanceiroModule,
    PublicacaoModule,
    IntegracaoModule,
  ],
})
export class AppModule {}
