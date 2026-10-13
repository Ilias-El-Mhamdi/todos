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
import { AttachmentUc } from './core/flows/attachment/attachment.uc';

// Controllers
import { LoginController } from './infra/controllers/login/login.controller';
import { AppStateController } from './infra/controllers/appState/appState.controller';
import { AttachmentController } from './infra/controllers/attachment/attachment.controller';
import { HealthController } from './infra/controllers/system/health.controller';
import { VersionController } from './infra/controllers/system/version.controller';

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
  controllers: [LoginController, AppStateController, AttachmentController, HealthController, VersionController],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }, AuthUc, AppStateUc, AttachmentUc],
})
export class AppModule {}
