import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../../core/repos/user/user.entity';
import { IUserReaderRepo } from '../../core/repos/user/user.reader.abstract-repo';
import { UserRepo } from './user/user.repo';

import { AppStateEntity } from '../../core/repos/appState/appState.entity';
import { IAppStateReaderRepo } from '../../core/repos/appState/appState.reader.abstract-repo';
import { IAppStateWriterRepo } from '../../core/repos/appState/appState.writer.abstract-repo';
import { AppStateRepo } from './appState/appState.repo';

import { AttachmentEntity } from '../../core/repos/attachment/attachment.entity';
import { IAttachmentReaderRepo } from '../../core/repos/attachment/attachment.reader.abstract-repo';
import { IAttachmentWriterRepo } from '../../core/repos/attachment/attachment.writer.abstract-repo';
import { AttachmentRepo } from './attachment/attachment.repo';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AppStateEntity, AttachmentEntity])],
  providers: [
    UserRepo,
    { provide: IUserReaderRepo, useExisting: UserRepo },

    AppStateRepo,
    { provide: IAppStateReaderRepo, useExisting: AppStateRepo },
    { provide: IAppStateWriterRepo, useExisting: AppStateRepo },

    AttachmentRepo,
    { provide: IAttachmentReaderRepo, useExisting: AttachmentRepo },
    { provide: IAttachmentWriterRepo, useExisting: AttachmentRepo },
  ],
  exports: [IUserReaderRepo, IAppStateReaderRepo, IAppStateWriterRepo, IAttachmentReaderRepo, IAttachmentWriterRepo],
})
export class RepoModule {}
