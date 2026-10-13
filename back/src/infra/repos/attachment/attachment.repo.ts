import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAttachmentReaderRepo } from '../../../core/repos/attachment/attachment.reader.abstract-repo';
import { IAttachmentWriterRepo } from '../../../core/repos/attachment/attachment.writer.abstract-repo';
import { AttachmentEntity } from '../../../core/repos/attachment/attachment.entity';

@Injectable()
export class AttachmentRepo implements IAttachmentReaderRepo, IAttachmentWriterRepo {
  constructor(
    @InjectRepository(AttachmentEntity)
    private readonly repo: Repository<AttachmentEntity>,
  ) {}

  findWithData(userId: string, id: string): Promise<AttachmentEntity | null> {
    return this.repo
      .createQueryBuilder('a')
      .addSelect('a.data')
      .where('a.id = :id AND a.userId = :userId', { id, userId })
      .getOne();
  }

  create(attachment: Pick<AttachmentEntity, 'userId' | 'name' | 'mimeType' | 'size' | 'data'>): Promise<AttachmentEntity> {
    return this.repo.save(this.repo.create(attachment));
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const res = await this.repo.delete({ id, userId });
    return !!res.affected;
  }
}
