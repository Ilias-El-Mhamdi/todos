import type { AttachmentEntity } from './attachment.entity';

export abstract class IAttachmentWriterRepo {
  abstract create(attachment: Pick<AttachmentEntity, 'userId' | 'name' | 'mimeType' | 'size' | 'data'>): Promise<AttachmentEntity>;
  /** False when there was nothing to delete. */
  abstract delete(userId: string, id: string): Promise<boolean>;
}
