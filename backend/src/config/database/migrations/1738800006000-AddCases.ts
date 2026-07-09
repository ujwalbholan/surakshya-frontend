import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCases1738800006000 implements MigrationInterface {
  name = 'AddCases1738800006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."case_status" AS ENUM('OPEN', 'INVESTIGATING', 'CLOSED', 'ESCALATED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."case_priority" AS ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')`,
    );

    await queryRunner.query(
      `CREATE TABLE "cases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "case_number" varchar(20) NOT NULL,
        "status" "public"."case_status" NOT NULL DEFAULT 'OPEN',
        "priority" "public"."case_priority" NOT NULL DEFAULT 'MEDIUM',
        "summary" text NOT NULL,
        "district" varchar(100),
        "province" varchar(50),
        "victim_name" varchar(150),
        "sos_event_id" uuid,
        "station_id" uuid,
        "assigned_officer_id" uuid,
        "assigned_unit_id" uuid,
        "opened_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "closed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cases" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cases_case_number" UNIQUE ("case_number")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_cases_status" ON "cases" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_cases_station" ON "cases" ("station_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_cases_sos_event_id" ON "cases" ("sos_event_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "cases" ADD CONSTRAINT "FK_cases_sos_event_id" FOREIGN KEY ("sos_event_id") REFERENCES "sos_events"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cases" ADD CONSTRAINT "FK_cases_station_id" FOREIGN KEY ("station_id") REFERENCES "police_stations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cases" ADD CONSTRAINT "FK_cases_assigned_officer_id" FOREIGN KEY ("assigned_officer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cases" ADD CONSTRAINT "FK_cases_assigned_unit_id" FOREIGN KEY ("assigned_unit_id") REFERENCES "patrol_units"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "case_status_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "case_id" uuid NOT NULL,
        "status" "public"."case_status" NOT NULL,
        "changed_by_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_case_status_history" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "case_status_history" ADD CONSTRAINT "FK_case_status_history_case_id" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "case_status_history" ADD CONSTRAINT "FK_case_status_history_changed_by_id" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "case_notes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "case_id" uuid NOT NULL,
        "author_id" uuid,
        "body" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_case_notes" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "case_notes" ADD CONSTRAINT "FK_case_notes_case_id" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "case_notes" ADD CONSTRAINT "FK_case_notes_author_id" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "case_notes" DROP CONSTRAINT "FK_case_notes_author_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "case_notes" DROP CONSTRAINT "FK_case_notes_case_id"`,
    );
    await queryRunner.query(`DROP TABLE "case_notes"`);

    await queryRunner.query(
      `ALTER TABLE "case_status_history" DROP CONSTRAINT "FK_case_status_history_changed_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "case_status_history" DROP CONSTRAINT "FK_case_status_history_case_id"`,
    );
    await queryRunner.query(`DROP TABLE "case_status_history"`);

    await queryRunner.query(
      `ALTER TABLE "cases" DROP CONSTRAINT "FK_cases_assigned_unit_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cases" DROP CONSTRAINT "FK_cases_assigned_officer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cases" DROP CONSTRAINT "FK_cases_station_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cases" DROP CONSTRAINT "FK_cases_sos_event_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_cases_sos_event_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_cases_station"`);
    await queryRunner.query(`DROP INDEX "public"."idx_cases_status"`);
    await queryRunner.query(`DROP TABLE "cases"`);
    await queryRunner.query(`DROP TYPE "public"."case_priority"`);
    await queryRunner.query(`DROP TYPE "public"."case_status"`);
  }
}
