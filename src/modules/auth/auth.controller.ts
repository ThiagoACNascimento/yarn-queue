import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() body: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const ip = request.ip ?? null;
    const userAgent = request.headers['user-agent'] ?? null;

    const { user, accessToken, refreshToken } = await this.authService.register(
      body,
      userAgent,
      ip,
    );

    this.setAccessCookie(response, accessToken);
    this.setRefreshCookie(response, refreshToken);

    return { user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const ipAdress = request.ip ?? null;
    const userAgent = request.headers['user-agent'] ?? null;

    const { user, accessToken, refreshToken } = await this.authService.login(
      body,
      userAgent,
      ipAdress,
    );

    this.setAccessCookie(response, accessToken);
    this.setRefreshCookie(response, refreshToken);

    return { user };
  }

  // add private method to config options
  private setAccessCookie(response: Response, access_token: string): void {
    response.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: '/auth/refresh',
    });
  }
}
