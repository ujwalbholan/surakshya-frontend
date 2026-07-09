import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditLogs1738800008000 implements MigrationInterface {
  name = 'AddAuditLogs1738800008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."audit_action" AS ENUM('LOGIN', 'LOGOUT', 'CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'CREATE_CASE', 'UPDATE_CASE', 'RESOLVE_SOS', 'CREATE_UNIT', 'UPDATE_UNIT')`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."audit_result" AS ENUM('success', 'failed')`,
    );

    await queryRunner.query(
      `CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actor_user_id" uuid,
        "actor_role" varchar(50) NOT NULL,
        "action" "public"."audit_action" NOT NULL,
        "target_entity_type" varchar(50),
        "target_entity_id" uuid,
        "target_label" varchar(255),
        "ip_address" varchar(45),
        "result" "public"."audit_result" NOT NULL,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_actor" ON "audit_logs" ("actor_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_action" ON "audit_logs" ("action")`,
    );

    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_actor_user_id" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_actor_user_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_audit_logs_action"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_logs_actor"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_logs_created_at"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TYPE "public"."audit_result"`);
    await queryRunner.query(`DROP TYPE "public"."audit_action"`);
  }
}
