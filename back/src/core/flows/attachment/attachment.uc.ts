import { Injectable, NotFoundException, UnsupportedMediaTypeException } from '@nestjs/common';
import { IAttachmentReaderRepo } from '../../repos/attachment/attachment.reader.abstract-repo';
import { IAttachmentWriterRepo } from '../../repos/attachment/attachment.writer.abstract-repo';

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export interface AttachmentMeta {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
}

// Photos et documents : le reste n'a pas d'intérêt pour une tâche et pourrait être servi tel quel au navigateur.
const ALLOWED = /^(image\/(jpeg|png|webp|gif|heic|heif)|application\/pdf)$/;

@Injectable()
export class AttachmentUc {
  constructor(
    private readonly reader: IAttachmentReaderRepo,
    private readonly writer: IAttachmentWriterRepo,
  ) {}

  async upload(userId: string, file: { originalname: string; mimetype: string; buffer: Buffer }): Promise<AttachmentMeta> {
    if (!ALLOWED.test(file.mimetype)) throw new UnsupportedMediaTypeException('Seules les images et les PDF sont acceptés');
    const saved = await this.writer.create({
      userId,
      name: file.originalname.slice(0, 200),
      mimeType: file.mimetype,
      size: file.buffer.length,
      data: file.buffer,
    });
    return { id: saved.id, name: saved.name, type: saved.mimeType, size: saved.size, createdAt: saved.createdAt.toISOString() };
  }

  async get(userId: string, id: string) {
    const attachment = await this.reader.findWithData(userId, id);
    if (!attachment) throw new NotFoundException('Pièce jointe introuvable');
    return attachment;
  }

  async delete(userId: string, id: string): Promise<void> {
    // Déjà supprimée (autre appareil, nouvel essai) : rien à faire.
    await this.writer.delete(userId, id);
  }
}
