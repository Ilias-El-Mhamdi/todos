import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1792000000000 implements MigrationInterface {
  name = 'InitialSchema1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "User"
                             (
                               "id"           uuid              NOT NULL DEFAULT gen_random_uuid(),
                               "username"     character varying NOT NULL,
                               "passwordHash" character varying NOT NULL,
                               "createdAt"    timestamptz       NOT NULL DEFAULT now(),
                               CONSTRAINT "UQ_User_username" UNIQUE ("username"),
                               CONSTRAINT "PK_User" PRIMARY KEY ("id")
                             )`);
    await queryRunner.query(`CREATE TABLE "AppState"
                             (
                               "userId"    uuid              NOT NULL,
                               "key"       character varying NOT NULL,
                               "value"     jsonb             NOT NULL,
                               "updatedAt" timestamptz       NOT NULL DEFAULT now(),
                               CONSTRAINT "PK_AppState" PRIMARY KEY ("userId", "key"),
                               CONSTRAINT "FK_AppState_user" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
                             )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "AppState"`);
    await queryRunner.query(`DROP TABLE "User"`);
  }
}
