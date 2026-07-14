/** Admin UI permission labels — display / matrix only; RolesGuard still uses Role enum. */
export const ROLE_MATRIX_PERMISSIONS = [
  'View All Users',
  'Manage Users',
  'View SOS Alerts',
  'Manage Cases',
  'Dispatch Units',
  'View Reports',
  'System Settings',
  'Audit Log',
  'API Keys',
] as const;

export type RoleMatrixPermission = (typeof ROLE_MATRIX_PERMISSIONS)[number];

export const ROLE_MATRIX_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'POLICE',
  'GUARDIAN',
  'USER',
] as const;

export type RoleMatrixRole = (typeof ROLE_MATRIX_ROLES)[number];

/** Seed values matching the former static frontend MATRIX. */
export const ROLE_MATRIX_DEFAULT: Record<RoleMatrixRole, boolean[]> = {
  SUPER_ADMIN: [true, true, true, true, true, true, true, true, true],
  ADMIN: [true, true, true, true, true, true, true, true, false],
  POLICE: [false, false, true, true, true, true, false, false, false],
  GUARDIAN: [false, false, true, false, false, false, false, false, false],
  USER: [false, false, false, false, false, false, false, false, false],
};
