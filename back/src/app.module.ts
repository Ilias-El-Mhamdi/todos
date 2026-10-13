import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

// Infra
import { DatabaseModule } from './infra/database/database.module';
import { RepoModule } from './infra/repos/repo.module';
import { JwtAuthGuard } from './infra/guards/jwtAuth.guard';

// Core flows
import { AuthUc } from './core/flows/auth/auth.uc';
import { AppStateUc } from './core/flows/appState/appState.uc';

// Controllers
import { LoginController } from './infra/controllers/login/login.controller';
import { AppStateController } from './infra/controllers/appState/appState.controller';
import { HealthController } from './infra/controllers/system/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RepoModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '90d' },
      }),
    }),
  ],
  controllers: [LoginController, AppStateController, HealthController],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }, AuthUc, AppStateUc],
})
export class AppModule {}
