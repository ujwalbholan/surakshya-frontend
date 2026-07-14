import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminPhase41738800010000 implements MigrationInterface {
  name = 'AddAdminPhase41738800010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."dispatch_event_action" AS ENUM('Dispatched', 'On Scene', 'Acknowledged', 'Arrived', 'Released')`,
    );

    await queryRunner.query(
      `CREATE TABLE "dispatch_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "action" "public"."dispatch_event_action" NOT NULL,
        "unit_id" uuid,
        "unit_name" varchar(100),
        "case_id" uuid,
        "case_number" varchar(50),
        "officer_id" uuid,
        "officer_name" varchar(255),
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dispatch_events" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_dispatch_events_created_at" ON "dispatch_events" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_dispatch_events_unit_id" ON "dispatch_events" ("unit_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_dispatch_events_case_id" ON "dispatch_events" ("case_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "dispatch_events" ADD CONSTRAINT "FK_dispatch_events_unit_id" FOREIGN KEY ("unit_id") REFERENCES "patrol_units"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispatch_events" ADD CONSTRAINT "FK_dispatch_events_case_id" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispatch_events" ADD CONSTRAINT "FK_dispatch_events_officer_id" FOREIGN KEY ("officer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "api_keys" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(150) NOT NULL,
        "prefix" varchar(32) NOT NULL,
        "key_hash" text NOT NULL,
        "created_by_id" uuid,
        "last_used_at" TIMESTAMP WITH TIME ZONE,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_api_keys" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_api_keys_prefix" ON "api_keys" ("prefix")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_api_keys_revoked_at" ON "api_keys" ("revoked_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" ADD CONSTRAINT "FK_api_keys_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "role_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role" varchar(50) NOT NULL,
        "permission" varchar(100) NOT NULL,
        "allowed" boolean NOT NULL DEFAULT false,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_role_permissions_role_permission" UNIQUE ("role", "permission")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_role_permissions_role" ON "role_permissions" ("role")`,
    );

    const permissions = [
      'View All Users',
      'Manage Users',
      'View SOS Alerts',
      'Manage Cases',
      'Dispatch Units',
      'View Reports',
      'System Settings',
      'Audit Log',
      'API Keys',
    ];
    const matrix: Record<string, boolean[]> = {
      SUPER_ADMIN: [true, true, true, true, true, true, true, true, true],
      ADMIN: [true, true, true, true, true, true, true, true, false],
      POLICE: [false, false, true, true, true, true, false, false, false],
      GUARDIAN: [false, false, true, false, false, false, false, false, false],
      USER: [false, false, false, false, false, false, false, false, false],
    };

    for (const [role, flags] of Object.entries(matrix)) {
      for (let i = 0; i < permissions.length; i++) {
        await queryRunner.query(
          `INSERT INTO "role_permissions" ("role", "permission", "allowed") VALUES ($1, $2, $3)`,
          [role, permissions[i], flags[i]],
        );
      }
    }

    await queryRunner.query(
      `CREATE TABLE "admin_settings" (
        "key" varchar(100) NOT NULL,
        "value" jsonb NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_settings" PRIMARY KEY ("key")
      )`,
    );

    const settings: Array<[string, string]> = [
      ['platform_name', JSON.stringify('Suraksha')],
      ['support_email', JSON.stringify('support@suraksha.com.np')],
      ['language', JSON.stringify('English')],
      ['session_timeout', JSON.stringify('30 min')],
      ['api_url', JSON.stringify('https://surakshya.onrender.com')],
      ['api_timeout', JSON.stringify('10s')],
      [
        'notifications',
        JSON.stringify({
          newSos: { email: true, push: true, sms: false },
          sosUnack: { email: true, push: true, sms: true },
          newUser: { email: true, push: false, sms: false },
          caseChange: { email: false, push: true, sms: false },
          systemHealth: { email: true, push: true, sms: false },
        }),
      ],
    ];

    for (const [key, value] of settings) {
      await queryRunner.query(
        `INSERT INTO "admin_settings" ("key", "value") VALUES ($1, $2::jsonb)`,
        [key, value],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "admin_settings"`);
    await queryRunner.query(`DROP INDEX "public"."idx_role_permissions_role"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(
      `ALTER TABLE "api_keys" DROP CONSTRAINT "FK_api_keys_created_by_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_api_keys_revoked_at"`);
    await queryRunner.query(`DROP INDEX "public"."idx_api_keys_prefix"`);
    await queryRunner.query(`DROP TABLE "api_keys"`);
    await queryRunner.query(
      `ALTER TABLE "dispatch_events" DROP CONSTRAINT "FK_dispatch_events_officer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispatch_events" DROP CONSTRAINT "FK_dispatch_events_case_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispatch_events" DROP CONSTRAINT "FK_dispatch_events_unit_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_dispatch_events_case_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_dispatch_events_unit_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_dispatch_events_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "dispatch_events"`);
    await queryRunner.query(`DROP TYPE "public"."dispatch_event_action"`);
  }
}
