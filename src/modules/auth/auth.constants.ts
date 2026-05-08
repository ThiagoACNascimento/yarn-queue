export const COOKIE_NAME = {
  REFRESH: 'refresh_token',
  ACCESS: 'access_token',
} as const;

export const COOKIE_PATH = {
  ROOT: '/',
  REFRESH: '/api/v1/auth/',
};
