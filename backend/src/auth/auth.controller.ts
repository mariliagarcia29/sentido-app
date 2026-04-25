import { Controller, Post, Get, Patch, Body, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OauthLoginDto } from './dto/oauth-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.auth.register(dto, req.ip ?? '');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, req.ip ?? '');
  }

  @Post('oauth')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  oauthLogin(@Body() dto: OauthLoginDto, @Req() req: Request) {
    return this.auth.oauthLogin(dto, req.ip ?? '');
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: User, @Req() req: Request) {
    // Extrai o payload decodificado que o Passport já validou e atachado ao request
    const jwtPayload = (req as any).user_payload as { jti?: string; exp?: number } | undefined;
    if (jwtPayload?.jti && jwtPayload?.exp) {
      await this.auth.logout(jwtPayload.jti, user.id, jwtPayload.exp, req.ip ?? '');
    }
    return { message: 'Sessão encerrada com sucesso' };
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser() user: User,
    @Body() body: { currentPassword: string; newPassword: string },
    @Req() req: Request,
  ) {
    return this.auth.changePassword(user.id, body.currentPassword, body.newPassword, (req as any).ip ?? '');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      locale: user.locale,
      isAdmin: user.isAdmin,
    };
  }
}
