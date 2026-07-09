import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEvidence1738800007000 implements MigrationInterface {
  name = 'AddEvidence1738800007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."evidence_file_type" AS ENUM('audio', 'gps', 'document', 'witness')`,
    );

    await queryRunner.query(
      `CREATE TABLE "evidence" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "case_id" uuid NOT NULL,
        "file_name" varchar(255) NOT NULL,
        "storage_key" text NOT NULL,
        "mime_type" varchar(100),
        "file_type" "public"."evidence_file_type" NOT NULL,
        "size_bytes" bigint NOT NULL,
        "checksum" varchar(64) NOT NULL,
        "uploaded_by_id" uuid NOT NULL,
        "captured_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_evidence" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_evidence_case_id" ON "evidence" ("case_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_evidence_file_type" ON "evidence" ("file_type")`,
    );

    await queryRunner.query(
      `ALTER TABLE "evidence" ADD CONSTRAINT "FK_evidence_case_id" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "evidence" ADD CONSTRAINT "FK_evidence_uploaded_by_id" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evidence" DROP CONSTRAINT "FK_evidence_uploaded_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evidence" DROP CONSTRAINT "FK_evidence_case_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_evidence_file_type"`);
    await queryRunner.query(`DROP INDEX "public"."idx_evidence_case_id"`);
    await queryRunner.query(`DROP TABLE "evidence"`);
    await queryRunner.query(`DROP TYPE "public"."evidence_file_type"`);
  }
}
