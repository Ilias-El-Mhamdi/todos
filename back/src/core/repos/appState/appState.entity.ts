import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

// Document JSON par clé (ex. « entretien.v1 ») : reprend tel quel ce que le front stockait dans le localStorage.
@Entity('AppState')
export class AppStateEntity {
  @PrimaryColumn('uuid')
  userId: string;

  @PrimaryColumn()
  key: string;

  @Column('jsonb')
  value: unknown;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
