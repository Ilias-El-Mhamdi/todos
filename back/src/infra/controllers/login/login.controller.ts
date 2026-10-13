import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { AuthUc } from '../../../core/flows/auth/auth.uc';
import type { JwtPayload } from '../../../core/flows/auth/jwtPayload';
import { hashPassword } from '../../../core/utils/password';
import { CurrentUser } from '../../decorators/currentUser.decorator';
import { Public } from '../../decorators/public.decorator';

class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

class HashDto {
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password: string;
}

@Controller('auth')
export class LoginController {
  constructor(private readonly authUc: AuthUc) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const { token, payload } = await this.authUc.login(dto.username, dto.password);
    return { token, user: payload };
  }

  // Outil pour créer le compte à la main : on colle le hash obtenu dans "User"."passwordHash". Ne stocke rien.
  @Public()
  @Post('hash')
  @HttpCode(200)
  async hash(@Body() dto: HashDto) {
    return { hash: await hashPassword(dto.password) };
  }

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return user;
  }
}
