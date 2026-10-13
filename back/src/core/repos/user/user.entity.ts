import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Pas d'inscription : la ligne est insérée à la main en SQL, avec un hash produit par POST /auth/hash.
@Entity('User')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  passwordHash: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
