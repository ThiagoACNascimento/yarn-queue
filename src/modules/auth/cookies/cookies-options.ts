import { COOKIE_PATH } from '../auth.constants';

export interface CookieEnvConfig {
  secure: boolean;
  accessTokenMaxAgeMs: number;
  refreshTokenMaxAgeMs: number;
}

export function buildAccessCookieOptions(config: CookieEnvConfig) {
  return {
    httpOnly: true,
    secure: config.secure,
    sameSite: 'lax' as const,
    maxAge: config.accessTokenMaxAgeMs,
    path: COOKIE_PATH.ROOT,
  };
}

export function buildRefreshCookieOptions(config: CookieEnvConfig) {
  return {
    httpOnly: true,
    secure: config.secure,
    sameSite: 'lax' as const,
    maxAge: config.refreshTokenMaxAgeMs,
    path: COOKIE_PATH.REFRESH,
  };
}
