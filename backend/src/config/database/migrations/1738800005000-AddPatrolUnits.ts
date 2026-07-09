import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPatrolUnits1738800005000 implements MigrationInterface {
  name = 'AddPatrolUnits1738800005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."unit_status" AS ENUM('available', 'dispatched', 'on_scene', 'offline')`,
    );

    await queryRunner.query(
      `CREATE TABLE "patrol_units" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "vehicle" varchar(100) NOT NULL,
        "zone" varchar(100) NOT NULL,
        "province" varchar(50) NOT NULL,
        "status" "public"."unit_status" NOT NULL DEFAULT 'available',
        "station_id" uuid,
        "lead_officer_id" uuid,
        "contact_phone" varchar(30),
        "latitude" double precision,
        "longitude" double precision,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_patrol_units" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_patrol_units_station" ON "patrol_units" ("station_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_patrol_units_status" ON "patrol_units" ("status")`,
    );

    await queryRunner.query(
      `ALTER TABLE "patrol_units" ADD CONSTRAINT "FK_patrol_units_station_id" FOREIGN KEY ("station_id") REFERENCES "police_stations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "patrol_units" ADD CONSTRAINT "FK_patrol_units_lead_officer_id" FOREIGN KEY ("lead_officer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "patrol_units" DROP CONSTRAINT "FK_patrol_units_lead_officer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patrol_units" DROP CONSTRAINT "FK_patrol_units_station_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_patrol_units_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_patrol_units_station"`);
    await queryRunner.query(`DROP TABLE "patrol_units"`);
    await queryRunner.query(`DROP TYPE "public"."unit_status"`);
  }
}
