import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPoliceOnboarding1738800002000 implements MigrationInterface {
  name = 'AddPoliceOnboarding1738800002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "police_stations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(150) NOT NULL,
        "address" character varying(300) NOT NULL,
        "contact_number" character varying(30) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_police_stations" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "station_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_station_id" FOREIGN KEY ("station_id") REFERENCES "police_stations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "police_invites" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "full_name" character varying(150) NOT NULL,
        "phone" character varying(30) NOT NULL,
        "station_id" uuid NOT NULL,
        "token_hash" text NOT NULL,
        "temp_password_hash" text NOT NULL,
        "invited_by" uuid NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "used_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_police_invites" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_police_invites_email" ON "police_invites" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_police_invites_token_hash" ON "police_invites" ("token_hash")`,
    );
    await queryRunner.query(
      `ALTER TABLE "police_invites" ADD CONSTRAINT "FK_police_invites_station_id" FOREIGN KEY ("station_id") REFERENCES "police_stations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "police_invites" ADD CONSTRAINT "FK_police_invites_invited_by" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "police_invites" DROP CONSTRAINT "FK_police_invites_invited_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "police_invites" DROP CONSTRAINT "FK_police_invites_station_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_police_invites_token_hash"`);
    await queryRunner.query(`DROP INDEX "public"."idx_police_invites_email"`);
    await queryRunner.query(`DROP TABLE "police_invites"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_station_id"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "station_id"`);
    await queryRunner.query(`DROP TABLE "police_stations"`);
  }
}
