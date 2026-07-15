import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGuardianEmergencyContact1738800011000
  implements MigrationInterface
{
  name = 'AddGuardianEmergencyContact1738800011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "guardian_links" ADD COLUMN IF NOT EXISTS "is_emergency_contact" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_guardian_links_child_emergency" ON "guardian_links" ("child_user_id", "is_emergency_contact")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_guardian_links_child_emergency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "guardian_links" DROP COLUMN IF EXISTS "is_emergency_contact"`,
    );
  }
}
