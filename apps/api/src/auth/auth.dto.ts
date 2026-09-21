import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  senha: string;

  @IsString()
  nomeEscritorio: string;

  @IsOptional()
  @IsString()
  cnpj?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  senha: string;
}
