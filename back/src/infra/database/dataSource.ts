import 'reflect-metadata';
import { config } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { UserEntity } from '../../core/repos/user/user.entity';
import { AppStateEntity } from '../../core/repos/appState/appState.entity';
import { AttachmentEntity } from '../../core/repos/attachment/attachment.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [UserEntity, AppStateEntity, AttachmentEntity],
  // .ts via le CLI en dev, .js une fois compilé : les migrations s'appliquent au démarrage (déploiement Render).
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsRun: true,
  synchronize: false,
});
