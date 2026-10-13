import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../../core/repos/user/user.entity';
import { IUserReaderRepo } from '../../core/repos/user/user.reader.abstract-repo';
import { UserRepo } from './user/user.repo';

import { AppStateEntity } from '../../core/repos/appState/appState.entity';
import { IAppStateReaderRepo } from '../../core/repos/appState/appState.reader.abstract-repo';
import { IAppStateWriterRepo } from '../../core/repos/appState/appState.writer.abstract-repo';
import { AppStateRepo } from './appState/appState.repo';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AppStateEntity])],
  providers: [
    UserRepo,
    { provide: IUserReaderRepo, useExisting: UserRepo },

    AppStateRepo,
    { provide: IAppStateReaderRepo, useExisting: AppStateRepo },
    { provide: IAppStateWriterRepo, useExisting: AppStateRepo },
  ],
  exports: [IUserReaderRepo, IAppStateReaderRepo, IAppStateWriterRepo],
})
export class RepoModule {}
