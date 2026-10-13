import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUserReaderRepo } from '../../repos/user/user.reader.abstract-repo';
import { verifyPassword } from '../../utils/password';
import type { JwtPayload } from './jwtPayload';

@Injectable()
export class AuthUc {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userReader: IUserReaderRepo,
  ) {}

  async login(username: string, password: string): Promise<{ token: string; payload: JwtPayload }> {
    const user = await this.userReader.findByUsername(username);
    // Même message dans les deux cas : on ne révèle pas si l'utilisateur existe.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    const payload: JwtPayload = { sub: user.id, username: user.username };
    const token = await this.jwtService.signAsync(payload);
    return { token, payload };
  }

  async verify(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Session invalide');
    }
  }
}
