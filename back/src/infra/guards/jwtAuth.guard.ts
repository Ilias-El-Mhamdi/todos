import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthUc } from '../../core/flows/auth/auth.uc';

// Token en header Authorization plutôt qu'en cookie : front (Cloudflare) et back (Render) sont sur deux sites
// différents, et Safari/iOS bloque les cookies tiers — ce qui casserait la PWA.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authUc: AuthUc,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Non authentifié');
    req['user'] = await this.authUc.verify(token);
    return true;
  }
}
