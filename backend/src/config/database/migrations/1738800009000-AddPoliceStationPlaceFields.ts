import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPoliceStationPlaceFields1738800009000
  implements MigrationInterface
{
  name = 'AddPoliceStationPlaceFields1738800009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "police_stations" ADD COLUMN "place_id" varchar(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "police_stations" ADD COLUMN "formatted_address" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "police_stations" DROP COLUMN "formatted_address"`,
    );
    await queryRunner.query(
      `ALTER TABLE "police_stations" DROP COLUMN "place_id"`,
    );
  }
}
