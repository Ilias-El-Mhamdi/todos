import type { AttachmentEntity } from './attachment.entity';

export abstract class IAttachmentReaderRepo {
  /** With its content. */
  abstract findWithData(userId: string, id: string): Promise<AttachmentEntity | null>;
}
