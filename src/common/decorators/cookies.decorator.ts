import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const Cookie = createParamDecorator(
  (keys: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const cookies = (request.cookies ?? {}) as Record<string, string>;

    return keys ? cookies[keys] : cookies;
  },
);
