import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSosStationAssignment1738800003000 implements MigrationInterface {
  name = 'AddSosStationAssignment1738800003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "police_stations" ADD COLUMN "latitude" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "police_stations" ADD COLUMN "longitude" double precision`,
    );

    await queryRunner.query(
      `ALTER TABLE "sos_events" ADD COLUMN "trigger_notes" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "sos_events" ADD COLUMN "assigned_station_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "sos_events" ADD CONSTRAINT "FK_sos_events_assigned_station_id" FOREIGN KEY ("assigned_station_id") REFERENCES "police_stations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sos_events" DROP CONSTRAINT "FK_sos_events_assigned_station_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sos_events" DROP COLUMN "assigned_station_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sos_events" DROP COLUMN "trigger_notes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "police_stations" DROP COLUMN "longitude"`,
    );
    await queryRunner.query(
      `ALTER TABLE "police_stations" DROP COLUMN "latitude"`,
    );
  }
}
