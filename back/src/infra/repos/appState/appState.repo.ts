import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAppStateReaderRepo } from '../../../core/repos/appState/appState.reader.abstract-repo';
import { IAppStateWriterRepo } from '../../../core/repos/appState/appState.writer.abstract-repo';
import { AppStateEntity } from '../../../core/repos/appState/appState.entity';

@Injectable()
export class AppStateRepo implements IAppStateReaderRepo, IAppStateWriterRepo {
  constructor(
    @InjectRepository(AppStateEntity)
    private readonly repo: Repository<AppStateEntity>,
  ) {}

  find(userId: string, key: string): Promise<AppStateEntity | null> {
    return this.repo.findOne({ where: { userId, key } });
  }

  upsert(userId: string, key: string, value: unknown): Promise<AppStateEntity> {
    // save() fait insert ou update selon la clé primaire (userId, key) et met à jour updatedAt.
    return this.repo.save(this.repo.create({ userId, key, value }));
  }
}
