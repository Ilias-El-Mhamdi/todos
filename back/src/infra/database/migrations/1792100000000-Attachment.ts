import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Attachment1792100000000 implements MigrationInterface {
  name = 'Attachment1792100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "Attachment"
                             (
                               "id"        uuid              NOT NULL DEFAULT gen_random_uuid(),
                               "userId"    uuid              NOT NULL,
                               "name"      character varying NOT NULL,
                               "mimeType"  character varying NOT NULL,
                               "size"      integer           NOT NULL,
                               "data"      bytea             NOT NULL,
                               "createdAt" timestamptz       NOT NULL DEFAULT now(),
                               CONSTRAINT "PK_Attachment" PRIMARY KEY ("id"),
                               CONSTRAINT "FK_Attachment_user" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
                             )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "Attachment"`);
  }
}
