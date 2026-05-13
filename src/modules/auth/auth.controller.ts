import {
  Body,
  Controller,
  Get,
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
import { CurrentUser } from './decorators/current-user.decorator';
import { Role } from '../../generated/prisma/enums';
import { Public } from './decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import {
  buildAccessCookieOptions,
  buildRefreshCookieOptions,
  CookieEnvConfig,
} from './cookies/cookies-options';
import { Cookie } from '../../common/decorators/cookies.decorator';

@Controller('auth')
export class AuthController {
  private readonly cookieConfig: CookieEnvConfig;
  private readonly MS_PER_MINUTE = 60 * 1000;
  private readonly MS_PER_DAY = 24 * 60 * 60 * 1000;

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {
    this.cookieConfig = {
      secure: this.config.getOrThrow<boolean>('COOKIE_SECURE'),
      accessTokenMaxAgeMs:
        this.config.getOrThrow<number>('ACCESS_TOKEN_EXPIRES_IN_MINUTES') *
        this.MS_PER_MINUTE,
      refreshTokenMaxAgeMs:
        this.config.getOrThrow<number>('REFRESH_TOKEN_EXPIRES_IN_DAYS') *
        this.MS_PER_DAY,
    };
  }

  @Post('signup')
  @Public()
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
  @Public()
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

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Cookie(COOKIE_NAME.REFRESH) refreshToken: string | undefined,
    @Res({ passthrough: true })
    response: Response,
  ): Promise<{ success: true }> {
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
    @Cookie(COOKIE_NAME.REFRESH) refreshToken: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    response.clearCookie(COOKIE_NAME.ACCESS, { path: COOKIE_PATH.ROOT });
    response.clearCookie(COOKIE_NAME.REFRESH, { path: COOKIE_PATH.REFRESH });
  }

  // TODO: change to users
  @Get('me')
  me(@CurrentUser() user: { id: string; role: Role }) {
    return { user };
  }

  private setAccessCookie(response: Response, access_token: string): void {
    response.cookie(
      COOKIE_NAME.ACCESS,
      access_token,
      buildAccessCookieOptions(this.cookieConfig),
    );
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie(
      COOKIE_NAME.REFRESH,
      refreshToken,
      buildRefreshCookieOptions(this.cookieConfig),
    );
  }
}
