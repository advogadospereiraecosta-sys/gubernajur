import { Controller, Post, Body, Get, UseGuards, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser('id') userId: string) {
    return this.auth.getProfile(userId);
  }

  @Post('exchange-session')
  @HttpCode(200)
  exchangeSession(@Body() body: { userId: string; escritorioId: string; email: string }) {
    return this.auth.exchangeSession(body.userId, body.escritorioId, body.email);
  }
}
