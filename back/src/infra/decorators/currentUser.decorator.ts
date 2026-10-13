import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../../core/flows/auth/jwtPayload';

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): JwtPayload => context.switchToHttp().getRequest<Request>()['user'],
);
