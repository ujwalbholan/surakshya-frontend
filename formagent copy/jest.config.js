/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/electron/shared/$1',
    '^@engine/(.*)$': '<rootDir>/engine/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  collectCoverageFrom: [
    'engine/**/*.ts',
    'src/utils/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};
