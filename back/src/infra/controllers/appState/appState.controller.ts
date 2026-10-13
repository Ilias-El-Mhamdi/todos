import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { IsDefined, IsOptional, IsString, Matches } from 'class-validator';
import { AppStateUc } from '../../../core/flows/appState/appState.uc';
import type { JwtPayload } from '../../../core/flows/auth/jwtPayload';
import { CurrentUser } from '../../decorators/currentUser.decorator';

class KeyParams {
  @Matches(/^[a-zA-Z0-9._-]{1,64}$/)
  key: string;
}

class PutStateDto {
  @IsDefined()
  value: unknown;

  /** Version serveur de départ (`updatedAt` reçu au dernier GET/PUT), null si rien n'était encore stocké. */
  @IsOptional()
  @IsString()
  baseUpdatedAt: string | null;
}

@Controller('state')
export class AppStateController {
  constructor(private readonly appStateUc: AppStateUc) {}

  /** `value: null` quand rien n'est encore stocké : le front y pousse alors son localStorage (migration). */
  @Get(':key')
  get(@CurrentUser() user: JwtPayload, @Param() { key }: KeyParams) {
    return this.appStateUc.get(user.sub, key);
  }

  @Put(':key')
  async put(@CurrentUser() user: JwtPayload, @Param() { key }: KeyParams, @Body() dto: PutStateDto) {
    const { updatedAt } = await this.appStateUc.save(user.sub, key, dto.value, dto.baseUpdatedAt ?? null);
    return { updatedAt };
  }
}
