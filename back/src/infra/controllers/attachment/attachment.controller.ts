import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AttachmentUc, MAX_ATTACHMENT_BYTES } from '../../../core/flows/attachment/attachment.uc';
import type { JwtPayload } from '../../../core/flows/auth/jwtPayload';
import { CurrentUser } from '../../decorators/currentUser.decorator';

@Controller('attachments')
export class AttachmentController {
  constructor(private readonly attachmentUc: AttachmentUc) {}

  /** Multipart, champ « file ». Renvoie les métadonnées que le front range dans le state. */
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 1 } }))
  upload(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('Fichier manquant');
    return this.attachmentUc.upload(user.sub, file);
  }

  @Get(':id')
  async download(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const attachment = await this.attachmentUc.get(user.sub, id);
    res.set({
      'content-type': attachment.mimeType,
      'content-length': String(attachment.data.length),
      // Le front garde déjà les fichiers dans son Cache API : pas de copie dans le cache HTTP, qui la resservirait
      // même à une requête sans token.
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    res.send(attachment.data);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.attachmentUc.delete(user.sub, id);
  }
}
