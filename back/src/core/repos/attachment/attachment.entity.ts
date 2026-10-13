import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Pièce jointe d'une tâche. Le contenu est stocké en base (bytea) : volume faible (photos compressées côté front,
// un seul utilisateur), pas de stockage objet à gérer. Le state ne garde que les métadonnées.
@Entity('Attachment')
export class AttachmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column()
  name: string;

  @Column()
  mimeType: string;

  @Column('int')
  size: number;

  // Pas chargé par défaut : seul le téléchargement en a besoin.
  @Column({ type: 'bytea', select: false })
  data: Buffer;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
