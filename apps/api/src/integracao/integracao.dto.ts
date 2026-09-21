import {
  IsOptional,
  IsString,
  IsIn,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

const TIPOS = [
  'TJRN',
  'TJSP',
  'TJMG',
  'TJRJ',
  'TJPB',
  'DATAJUD',
  'GOOGLE_CALENDAR',
  'EMAIL',
  'WHATSAPP',
  'CLAUDE',
] as const;

const STATUS = ['ATIVA', 'INATIVA', 'ERRO', 'PENDENTE'] as const;

export class CreateIntegracaoDto {
  @IsIn(TIPOS)
  tipo!: (typeof TIPOS)[number];

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nome!: string;

  @IsOptional()
  @IsIn(STATUS)
  status?: (typeof STATUS)[number];

  @IsOptional()
  @IsObject()
  @Type(() => Object)
  config?: Record<string, unknown>;
}

export class UpdateIntegracaoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nome?: string;

  @IsOptional()
  @IsIn(STATUS)
  status?: (typeof STATUS)[number];

  @IsOptional()
  @IsObject()
  @Type(() => Object)
  config?: Record<string, unknown>;
}
