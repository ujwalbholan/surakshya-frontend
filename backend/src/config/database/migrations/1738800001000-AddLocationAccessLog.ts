import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocationAccessLog1738800001000 implements MigrationInterface {
  name = 'AddLocationAccessLog1738800001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "location_access_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "accessor_user_id" uuid NOT NULL,
        "accessor_role" character varying(50) NOT NULL,
        "target_user_id" uuid,
        "target_device_id" uuid,
        "endpoint" character varying(255) NOT NULL,
        "context" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_location_access_logs" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_access_logs" ADD CONSTRAINT "FK_location_access_logs_accessor_user_id" FOREIGN KEY ("accessor_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_access_logs" ADD CONSTRAINT "FK_location_access_logs_target_user_id" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_access_logs" ADD CONSTRAINT "FK_location_access_logs_target_device_id" FOREIGN KEY ("target_device_id") REFERENCES "device"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "location_access_logs"`);
  }
}
