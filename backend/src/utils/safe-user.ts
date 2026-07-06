/* eslint-disable @typescript-eslint/no-unused-vars */
import { User } from 'src/feature/user/entities/user.entity';

export function safeUser(user: User): Omit<User, 'password_hash'> {
  const { password_hash, ...safe } = user;
  return safe;
}
