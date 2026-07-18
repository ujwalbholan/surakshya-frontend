import { MigrationInterface, QueryRunner } from 'typeorm';

export class SosStartedAtTimestamptz1738800013000
  implements MigrationInterface
{
  name = 'SosStartedAtTimestamptz1738800013000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Interpret existing wall-clock values as UTC so police dashboards show
    // the real activation instant instead of a timezone-shifted relative time.
    await queryRunner.query(
      `ALTER TABLE "sos_events"
       ALTER COLUMN "startedAt" TYPE TIMESTAMPTZ
       USING ("startedAt" AT TIME ZONE 'UTC')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sos_events"
       ALTER COLUMN "startedAt" TYPE TIMESTAMP
       USING ("startedAt" AT TIME ZONE 'UTC')`,
    );
  }
}
