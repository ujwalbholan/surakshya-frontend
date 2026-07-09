import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPoliceProvisioning1738800004000 implements MigrationInterface {
  name = 'AddPoliceProvisioning1738800004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."police_account_status" AS ENUM('PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."police_station_link_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "police_account_status" "public"."police_account_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "must_change_password" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "temp_password_hash" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "temp_password_expires_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "temp_password_resend_count" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "temp_password_last_resend_at" TIMESTAMP WITH TIME ZONE`,
    );

    await queryRunner.query(
      `CREATE TABLE "police_station_links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "requested_by_admin_id" uuid NOT NULL,
        "officer_id" uuid NOT NULL,
        "station_id" uuid NOT NULL,
        "status" "public"."police_station_link_status" NOT NULL DEFAULT 'PENDING',
        "reviewed_by_super_admin_id" uuid,
        "reviewed_at" TIMESTAMP WITH TIME ZONE,
        "rejection_reason" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_police_station_links" PRIMARY KEY ("id"),
        CONSTRAINT "uq_police_station_links_officer_station" UNIQUE ("officer_id", "station_id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_police_station_links_officer" ON "police_station_links" ("officer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_police_station_links_station" ON "police_station_links" ("station_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_police_station_links_status" ON "police_station_links" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_police_station_links_requested_by" ON "police_station_links" ("requested_by_admin_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "police_station_links" ADD CONSTRAINT "FK_police_station_links_requested_by_admin_id" FOREIGN KEY ("requested_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "police_station_links" ADD CONSTRAINT "FK_police_station_links_officer_id" FOREIGN KEY ("officer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "police_station_links" ADD CONSTRAINT "FK_police_station_links_station_id" FOREIGN KEY ("station_id") REFERENCES "police_stations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "police_station_links" ADD CONSTRAINT "FK_police_station_links_reviewed_by_super_admin_id" FOREIGN KEY ("reviewed_by_super_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "police_station_links" DROP CONSTRAINT "FK_police_station_links_reviewed_by_super_admin_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "police_station_links" DROP CONSTRAINT "FK_police_station_links_station_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "police_station_links" DROP CONSTRAINT "FK_police_station_links_officer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "police_station_links" DROP CONSTRAINT "FK_police_station_links_requested_by_admin_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_police_station_links_requested_by"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_police_station_links_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_police_station_links_station"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_police_station_links_officer"`,
    );
    await queryRunner.query(`DROP TABLE "police_station_links"`);

    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "temp_password_last_resend_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "temp_password_resend_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "temp_password_expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "temp_password_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "must_change_password"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "police_account_status"`,
    );

    await queryRunner.query(`DROP TYPE "public"."police_station_link_status"`);
    await queryRunner.query(`DROP TYPE "public"."police_account_status"`);
  }
}
