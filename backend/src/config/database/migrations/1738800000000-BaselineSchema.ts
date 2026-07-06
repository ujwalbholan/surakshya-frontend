import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaselineSchema1738800000000 implements MigrationInterface {
  name = 'BaselineSchema1738800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TYPE "public"."user_role" AS ENUM('USER', 'GUARDIAN', 'POLICE', 'ADMIN', 'SUPER_ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "full_name" character varying(150) NOT NULL,
        "email" character varying(255),
        "phone" character varying(30) NOT NULL,
        "password_hash" text,
        "role" "public"."user_role" NOT NULL DEFAULT 'USER',
        "is_active" boolean NOT NULL DEFAULT true,
        "phone_verified" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_phone" UNIQUE ("phone"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_phone" ON "users" ("phone")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_role" ON "users" ("role")`,
    );
    await queryRunner.query(
      `CREATE TABLE "device" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "imei" character varying NOT NULL,
        "label" character varying,
        "user_id" uuid,
        "lastSeenAt" TIMESTAMP WITH TIME ZONE,
        "isOnline" boolean NOT NULL DEFAULT false,
        CONSTRAINT "UQ_device_imei" UNIQUE ("imei"),
        CONSTRAINT "PK_device" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD CONSTRAINT "FK_device_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TABLE "sos_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "device_id" uuid NOT NULL,
        "status" character varying NOT NULL DEFAULT 'active',
        "eventType" character varying(50),
        "latitude" double precision,
        "longitude" double precision,
        "altitudeM" double precision,
        "speedKmph" double precision,
        "satellites" integer,
        "resolved_by" uuid,
        "notes" text,
        "startedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "resolvedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_sos_events" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "sos_events" ADD CONSTRAINT "FK_sos_events_device_id" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sos_events" ADD CONSTRAINT "FK_sos_events_resolved_by" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TABLE "location_pings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "device_id" uuid NOT NULL,
        "sos_event_id" uuid,
        "latitude" double precision NOT NULL,
        "longitude" double precision NOT NULL,
        "altitudeM" double precision,
        "speedKmph" double precision,
        "satellites" integer,
        "hdop" double precision,
        "recordedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_location_pings" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_pings" ADD CONSTRAINT "FK_location_pings_device_id" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location_pings" ADD CONSTRAINT "FK_location_pings_sos_event_id" FOREIGN KEY ("sos_event_id") REFERENCES "sos_events"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TABLE "guardian_links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "child_user_id" uuid NOT NULL,
        "guardian_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_guardian_links_child_guardian" UNIQUE ("child_user_id", "guardian_user_id"),
        CONSTRAINT "PK_guardian_links" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_guardian_links_child" ON "guardian_links" ("child_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_guardian_links_guardian" ON "guardian_links" ("guardian_user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "guardian_links" ADD CONSTRAINT "FK_guardian_links_child_user_id" FOREIGN KEY ("child_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "guardian_links" ADD CONSTRAINT "FK_guardian_links_guardian_user_id" FOREIGN KEY ("guardian_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TABLE "guardian_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "requester_id" uuid NOT NULL,
        "requester_name" character varying(150) NOT NULL,
        "target_email" character varying(255) NOT NULL,
        "target_phone" character varying(30) NOT NULL,
        "target_name" character varying(150) NOT NULL,
        "direction" character varying(20) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'PENDING',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_guardian_requests" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_guardian_requests_requester" ON "guardian_requests" ("requester_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_guardian_requests_target_email" ON "guardian_requests" ("target_email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_guardian_requests_status" ON "guardian_requests" ("status")`,
    );
    await queryRunner.query(
      `CREATE TABLE "notification_failures" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying(10) NOT NULL,
        "recipient" character varying(255) NOT NULL,
        "message" text NOT NULL,
        "error" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_failures" PRIMARY KEY ("id")
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notification_failures"`);
    await queryRunner.query(`DROP TABLE "guardian_requests"`);
    await queryRunner.query(`DROP TABLE "guardian_links"`);
    await queryRunner.query(`DROP TABLE "location_pings"`);
    await queryRunner.query(`DROP TABLE "sos_events"`);
    await queryRunner.query(`DROP TABLE "device"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."user_role"`);
  }
}
