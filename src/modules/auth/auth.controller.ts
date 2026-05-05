import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, token } = await this.authService.register(body);

    this.setAccessCookie(response, token);

    return { user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, token } = await this.authService.login(body);

    this.setAccessCookie(response, token);

    return { user };
  }

  private setAccessCookie(response: Response, token: string): void {
    response.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
  }
}
