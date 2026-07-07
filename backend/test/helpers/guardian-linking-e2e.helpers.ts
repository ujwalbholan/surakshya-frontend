import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/feature/user/entities/user.entity';
import { GuardianLink } from 'src/feature/guardian/entities/guardian-link.entity';
import { GuardianRequest } from 'src/feature/guardian/entities/guardian-request.entity';
import { Role } from 'src/feature/auth/dto/auth.dto';
import { TokenService } from 'src/utils/token/token.service';
import { App } from 'supertest/types';

const TEST_PASSWORD = 'E2eTestPass1';

export interface TestUser {
  id: string;
  email: string;
  token: string;
  role: Role;
}

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function testEmail(label: string): string {
  return `e2e-${label}-${uniqueSuffix()}@surakshya.test`.toLowerCase();
}

export function testPhone(): string {
  const suffix = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  return `98${suffix}`;
}

function normalizePhone(phone: string): string {
  return phone.trim().replace(/^\+977/, '').replace(/[\s-]/g, '');
}

export async function issueToken(
  app: INestApplication<App>,
  user: Pick<User, 'id' | 'email' | 'full_name' | 'role'>,
): Promise<string> {
  const tokenService = app.get(TokenService);
  const { accessToken } = await tokenService.generateToken({
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  });
  return accessToken;
}

export async function seedTestUser(
  app: INestApplication<App>,
  dataSource: DataSource,
  opts: {
    email: string;
    phone: string;
    full_name: string;
    role: Role;
    password?: string;
    phone_verified?: boolean;
  },
): Promise<TestUser> {
  const password = opts.password ?? TEST_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await dataSource.getRepository(User).save(
    dataSource.getRepository(User).create({
      full_name: opts.full_name,
      email: opts.email,
      phone: normalizePhone(opts.phone),
      password_hash: passwordHash,
      role: opts.role,
      is_active: true,
      phone_verified: opts.phone_verified ?? false,
    }),
  );

  const token = await issueToken(app, user);

  return {
    id: user.id,
    email: opts.email,
    token,
    role: opts.role,
  };
}

export async function setGuardianCredentials(
  dataSource: DataSource,
  email: string,
  password: string,
  phoneVerified = true,
): Promise<void> {
  const passwordHash = await bcrypt.hash(password, 12);
  await dataSource.getRepository(User).update(
    { email },
    {
      password_hash: passwordHash,
      phone_verified: phoneVerified,
    },
  );
}

export async function findGuardianLink(
  dataSource: DataSource,
  childUserId: string,
  guardianUserId: string,
): Promise<GuardianLink | null> {
  return dataSource.getRepository(GuardianLink).findOne({
    where: {
      child_user_id: childUserId,
      guardian_user_id: guardianUserId,
    },
  });
}

export async function cleanupTestUsers(
  dataSource: DataSource,
  emails: string[],
): Promise<void> {
  if (emails.length === 0) return;

  const users = await dataSource
    .getRepository(User)
    .createQueryBuilder('u')
    .where('u.email IN (:...emails)', { emails })
    .getMany();

  const userIds = users.map((u) => u.id);
  if (userIds.length === 0) return;

  await dataSource
    .getRepository(GuardianLink)
    .createQueryBuilder()
    .delete()
    .where('child_user_id IN (:...userIds) OR guardian_user_id IN (:...userIds)', {
      userIds,
    })
    .execute();

  await dataSource
    .getRepository(GuardianRequest)
    .createQueryBuilder()
    .delete()
    .where(
      'requester_id IN (:...userIds) OR target_email IN (:...emails)',
      { userIds, emails },
    )
    .execute();

  await dataSource
    .getRepository(User)
    .createQueryBuilder()
    .delete()
    .where('id IN (:...userIds)', { userIds })
    .execute();
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export { TEST_PASSWORD };
