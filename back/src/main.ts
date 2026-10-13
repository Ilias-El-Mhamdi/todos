import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Le state complet (recettes, historique…) peut dépasser la limite par défaut de 100 kB.
  app.use(json({ limit: '2mb' }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' });
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
