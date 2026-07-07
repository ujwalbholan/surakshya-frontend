import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
  VersioningType,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

class NoOpThrottlerGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}
import {
  authHeader,
  cleanupTestUsers,
  findGuardianLink,
  issueToken,
  seedTestUser,
  setGuardianCredentials,
  testEmail,
  testPhone,
  TEST_PASSWORD,
} from './helpers/guardian-linking-e2e.helpers';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { User } from 'src/feature/user/entities/user.entity';

function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: [VERSION_NEUTRAL, '1'],
  });
}

describe('Guardian linking (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  const createdEmails: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(APP_GUARD)
      .useClass(NoOpThrottlerGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await cleanupTestUsers(dataSource, createdEmails);
    await app.close();
  });

  function trackEmail(...emails: string[]): void {
    createdEmails.push(...emails);
  }

  describe('Option 1 — GUARDIAN_TO_CHILD (guardian invites child)', () => {
    it('completes invite → child inbox → accept with correct guardian_links orientation', async () => {
      const childEmail = testEmail('child-opt1');
      const guardianEmail = testEmail('guardian-opt1');
      trackEmail(childEmail, guardianEmail);

      const child = await seedTestUser(app, dataSource, {
        email: childEmail,
        phone: testPhone(),
        full_name: 'E2E Child',
        role: Role.USER,
      });

      const guardian = await seedTestUser(app, dataSource, {
        email: guardianEmail,
        phone: testPhone(),
        full_name: 'E2E Guardian',
        role: Role.GUARDIAN,
      });

      await request(app.getHttpServer())
        .post('/guardian/add-ward')
        .set(authHeader(guardian.token))
        .send({ child_email: childEmail })
        .expect(201);

      const inboxRes = await request(app.getHttpServer())
        .get('/guardians/requests')
        .set(authHeader(child.token))
        .expect(200);

      expect(inboxRes.body.requests).toHaveLength(1);
      expect(inboxRes.body.requests[0]).toMatchObject({
        direction: 'GUARDIAN_TO_CHILD',
        status: 'PENDING',
        target_email: childEmail,
      });

      const requestId = inboxRes.body.requests[0].id as string;

      const acceptRes = await request(app.getHttpServer())
        .post(`/guardians/requests/${requestId}/accept`)
        .set(authHeader(child.token))
        .expect(201);

      expect(acceptRes.body.message).toContain('linked');

      const link = await findGuardianLink(dataSource, child.id, guardian.id);
      expect(link).not.toBeNull();
      expect(link!.child_user_id).toBe(child.id);
      expect(link!.guardian_user_id).toBe(guardian.id);

      const guardiansRes = await request(app.getHttpServer())
        .get('/guardians')
        .set(authHeader(child.token))
        .expect(200);

      expect(guardiansRes.body.guardians).toHaveLength(1);
      expect(guardiansRes.body.guardians[0].email).toBe(guardianEmail);

      const wardsRes = await request(app.getHttpServer())
        .get('/guardian/me')
        .set(authHeader(guardian.token))
        .expect(200);

      expect(wardsRes.body.wards).toHaveLength(1);
      expect(wardsRes.body.wards[0].id).toBe(child.id);
    });

    it('rejects guardian (requester) accepting via child endpoint', async () => {
      const childEmail = testEmail('child-opt1-guard');
      const guardianEmail = testEmail('guardian-opt1-guard');
      trackEmail(childEmail, guardianEmail);

      const child = await seedTestUser(app, dataSource, {
        email: childEmail,
        phone: testPhone(),
        full_name: 'E2E Child G',
        role: Role.USER,
      });

      const guardian = await seedTestUser(app, dataSource, {
        email: guardianEmail,
        phone: testPhone(),
        full_name: 'E2E Guardian G',
        role: Role.GUARDIAN,
      });

      await request(app.getHttpServer())
        .post('/guardian/add-ward')
        .set(authHeader(guardian.token))
        .send({ child_email: childEmail })
        .expect(201);

      const inboxRes = await request(app.getHttpServer())
        .get('/guardians/requests')
        .set(authHeader(child.token))
        .expect(200);

      const requestId = inboxRes.body.requests[0].id as string;

      await request(app.getHttpServer())
        .post(`/guardians/requests/${requestId}/accept`)
        .set(authHeader(guardian.token))
        .expect(403);

      const link = await findGuardianLink(dataSource, child.id, guardian.id);
      expect(link).toBeNull();
    });

    it('hides requests from unrelated users', async () => {
      const childEmail = testEmail('child-opt1-hide');
      const otherChildEmail = testEmail('child-opt1-other');
      const guardianEmail = testEmail('guardian-opt1-hide');
      trackEmail(childEmail, otherChildEmail, guardianEmail);

      const child = await seedTestUser(app, dataSource, {
        email: childEmail,
        phone: testPhone(),
        full_name: 'E2E Child H',
        role: Role.USER,
      });

      const otherChild = await seedTestUser(app, dataSource, {
        email: otherChildEmail,
        phone: testPhone(),
        full_name: 'E2E Other',
        role: Role.USER,
      });

      const guardian = await seedTestUser(app, dataSource, {
        email: guardianEmail,
        phone: testPhone(),
        full_name: 'E2E Guardian H',
        role: Role.GUARDIAN,
      });

      await request(app.getHttpServer())
        .post('/guardian/add-ward')
        .set(authHeader(guardian.token))
        .send({ child_email: childEmail })
        .expect(201);

      const otherInbox = await request(app.getHttpServer())
        .get('/guardians/requests')
        .set(authHeader(otherChild.token))
        .expect(200);

      expect(otherInbox.body.requests).toHaveLength(0);

      const inboxRes = await request(app.getHttpServer())
        .get('/guardians/requests')
        .set(authHeader(child.token))
        .expect(200);

      const requestId = inboxRes.body.requests[0].id as string;

      await request(app.getHttpServer())
        .post(`/guardians/requests/${requestId}/accept`)
        .set(authHeader(otherChild.token))
        .expect(400);
    });
  });

  describe('Option 2 — CHILD_TO_GUARDIAN (child invites guardian)', () => {
    it('completes invite → guardian inbox → accept with correct guardian_links orientation', async () => {
      const childEmail = testEmail('child-opt2');
      const guardianEmail = testEmail('guardian-opt2');
      trackEmail(childEmail, guardianEmail);

      const child = await seedTestUser(app, dataSource, {
        email: childEmail,
        phone: testPhone(),
        full_name: 'E2E Child2',
        role: Role.USER,
      });

      const inviteRes = await request(app.getHttpServer())
        .post('/guardians')
        .set(authHeader(child.token))
        .send({
          full_name: 'E2E Guardian2',
          email: guardianEmail,
          phone: testPhone(),
        })
        .expect(201);

      expect(inviteRes.body.request_id).toBeDefined();

      await setGuardianCredentials(dataSource, guardianEmail, TEST_PASSWORD, true);

      const guardianUser = await dataSource
        .getRepository(User)
        .findOneByOrFail({ email: guardianEmail });
      const guardianToken = await issueToken(app, guardianUser);
      const guardianId = inviteRes.body.guardian.id as string;

      const inboxRes = await request(app.getHttpServer())
        .get('/guardian/requests')
        .set(authHeader(guardianToken))
        .expect(200);

      expect(inboxRes.body.requests).toHaveLength(1);
      expect(inboxRes.body.requests[0]).toMatchObject({
        direction: 'CHILD_TO_GUARDIAN',
        status: 'PENDING',
        requester_id: child.id,
      });

      const requestId = inboxRes.body.requests[0].id as string;

      const acceptRes = await request(app.getHttpServer())
        .post(`/guardian/requests/${requestId}/accept`)
        .set(authHeader(guardianToken))
        .expect(201);

      expect(acceptRes.body.message).toContain('accepted');

      const link = await findGuardianLink(dataSource, child.id, guardianId);
      expect(link).not.toBeNull();
      expect(link!.child_user_id).toBe(child.id);
      expect(link!.guardian_user_id).toBe(guardianId);
    });

    it('hides requests from unrelated guardians', async () => {
      const childEmail = testEmail('child-opt2-hide');
      const guardianEmail = testEmail('guardian-opt2-hide');
      const otherGuardianEmail = testEmail('guardian-opt2-other');
      trackEmail(childEmail, guardianEmail, otherGuardianEmail);

      const child = await seedTestUser(app, dataSource, {
        email: childEmail,
        phone: testPhone(),
        full_name: 'E2E Child2H',
        role: Role.USER,
      });

      await request(app.getHttpServer())
        .post('/guardians')
        .set(authHeader(child.token))
        .send({
          full_name: 'E2E Guardian2H',
          email: guardianEmail,
          phone: testPhone(),
        })
        .expect(201);

      const otherGuardian = await seedTestUser(app, dataSource, {
        email: otherGuardianEmail,
        phone: testPhone(),
        full_name: 'E2E OtherG',
        role: Role.GUARDIAN,
      });

      const otherInbox = await request(app.getHttpServer())
        .get('/guardian/requests')
        .set(authHeader(otherGuardian.token))
        .expect(200);

      expect(otherInbox.body.requests).toHaveLength(0);
    });
  });

  describe('SOS access after linking', () => {
    it('linked guardian can fetch ward SOS; unlinked guardian gets 403', async () => {
      const childEmail = testEmail('child-sos');
      const guardianEmail = testEmail('guardian-sos');
      const strangerEmail = testEmail('guardian-stranger');
      trackEmail(childEmail, guardianEmail, strangerEmail);

      const child = await seedTestUser(app, dataSource, {
        email: childEmail,
        phone: testPhone(),
        full_name: 'E2E Child SOS',
        role: Role.USER,
      });

      const guardian = await seedTestUser(app, dataSource, {
        email: guardianEmail,
        phone: testPhone(),
        full_name: 'E2E Guardian SOS',
        role: Role.GUARDIAN,
      });

      const stranger = await seedTestUser(app, dataSource, {
        email: strangerEmail,
        phone: testPhone(),
        full_name: 'E2E Stranger',
        role: Role.GUARDIAN,
      });

      await request(app.getHttpServer())
        .post('/guardian/add-ward')
        .set(authHeader(guardian.token))
        .send({ child_email: childEmail })
        .expect(201);

      const inboxRes = await request(app.getHttpServer())
        .get('/guardians/requests')
        .set(authHeader(child.token))
        .expect(200);

      const requestId = inboxRes.body.requests[0].id as string;

      await request(app.getHttpServer())
        .post(`/guardians/requests/${requestId}/accept`)
        .set(authHeader(child.token))
        .expect(201);

      const linkedSos = await request(app.getHttpServer())
        .get(`/guardian/wards/${child.id}/sos`)
        .set(authHeader(guardian.token))
        .expect(200);

      expect(linkedSos.body.wardId).toBe(child.id);
      expect(Array.isArray(linkedSos.body.data)).toBe(true);

      await request(app.getHttpServer())
        .get(`/guardian/wards/${child.id}/sos`)
        .set(authHeader(stranger.token))
        .expect(403);
    });
  });
});
