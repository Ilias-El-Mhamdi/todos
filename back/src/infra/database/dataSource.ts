import 'reflect-metadata';
import { config } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { UserEntity } from '../../core/repos/user/user.entity';
import { AppStateEntity } from '../../core/repos/appState/appState.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [UserEntity, AppStateEntity],
  // .ts via le CLI en dev, .js une fois compilé : les migrations s'appliquent au démarrage (déploiement Render).
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsRun: true,
  synchronize: false,
});
