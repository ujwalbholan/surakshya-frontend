import { config } from 'dotenv';
import { resolve } from 'path';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../../feature/user/entities/user.entity';
import { Role } from '../../feature/auth/dto/auth.dto';

config({ path: resolve(__dirname, '../../..', '.local.env') });
config({ path: resolve(__dirname, '../../..', '.env') });

const DEFAULT_EMAIL = 'superadmin@surakshya.dev';
const DEFAULT_PASSWORD = 'SuperAdmin@12345';
const DEFAULT_NAME = 'Super Admin';
const DEFAULT_PHONE = '9800000001';

async function seedSuperAdmin() {
  const email = (
    process.env.SUPER_ADMIN_EMAIL ?? DEFAULT_EMAIL
  ).trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD ?? DEFAULT_PASSWORD;
  const fullName = process.env.SUPER_ADMIN_NAME ?? DEFAULT_NAME;
  const phone = (process.env.SUPER_ADMIN_PHONE ?? DEFAULT_PHONE).replace(
    /^\+977/,
    '',
  );

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'surakshya',
    entities: [resolve(__dirname, '../../**/*.entity{.ts,.js}')],
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  await dataSource.initialize();
  const userRepo = dataSource.getRepository(User);

  const existing = await userRepo.findOne({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    existing.full_name = fullName;
    existing.phone = phone;
    existing.password_hash = passwordHash;
    existing.role = Role.SUPER_ADMIN;
    existing.is_active = true;
    existing.phone_verified = true;
    await userRepo.save(existing);
    console.log(`Updated existing super admin: ${email}`);
  } else {
    await userRepo.save(
      userRepo.create({
        full_name: fullName,
        email,
        phone,
        password_hash: passwordHash,
        role: Role.SUPER_ADMIN,
        is_active: true,
        phone_verified: true,
      }),
    );
    console.log(`Created super admin: ${email}`);
  }

  console.log('\nSuper admin credentials (use at /admin/login):');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);

  await dataSource.destroy();
}

seedSuperAdmin().catch((error: unknown) => {
  console.error('Failed to seed super admin:', error);
  process.exit(1);
});
