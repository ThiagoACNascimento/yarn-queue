import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { COOKIE_NAME, COOKIE_PATH } from './auth.constants';

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

  // add @Cookie() decorator
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    const refreshToken = request.cookies[COOKIE_NAME.REFRESH] as
      | string
      | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const newAccessToken = await this.authService.refresh(refreshToken);

    this.setAccessCookie(response, newAccessToken);

    return { success: true };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const refreshToken = request.cookies[COOKIE_NAME.REFRESH] as
      | string
      | undefined;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    response.clearCookie(COOKIE_NAME.ACCESS, { path: COOKIE_PATH.ROOT });
    response.clearCookie(COOKIE_NAME.REFRESH, { path: COOKIE_PATH.REFRESH });
  }

  // add private method to config options
  private setAccessCookie(response: Response, access_token: string): void {
    response.cookie(COOKIE_NAME.ACCESS, access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: COOKIE_PATH.ROOT,
    });
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie(COOKIE_NAME.REFRESH, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: COOKIE_PATH.REFRESH,
    });
  }
}
