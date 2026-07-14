import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ROLE_MATRIX_DEFAULT,
  ROLE_MATRIX_PERMISSIONS,
  ROLE_MATRIX_ROLES,
} from 'src/constants/roles-matrix.constants';
import { RolesMatrixService } from './roles-matrix.service';
import { RolePermission } from './entities/role-permission.entity';

describe('RolesMatrixService', () => {
  let service: RolesMatrixService;
  let repo: jest.Mocked<Repository<RolePermission>>;

  const seedRows = (): RolePermission[] => {
    const rows: RolePermission[] = [];
    for (const role of ROLE_MATRIX_ROLES) {
      const flags = ROLE_MATRIX_DEFAULT[role];
      for (let i = 0; i < ROLE_MATRIX_PERMISSIONS.length; i++) {
        rows.push({
          id: `${role}-${i}`,
          role,
          permission: ROLE_MATRIX_PERMISSIONS[i],
          allowed: flags[i],
          updated_at: new Date(),
        });
      }
    }
    return rows;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesMatrixService,
        {
          provide: getRepositoryToken(RolePermission),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn((data) => data),
            save: jest.fn(async (entity) => entity),
          },
        },
      ],
    }).compile();

    service = module.get(RolesMatrixService);
    repo = module.get(getRepositoryToken(RolePermission));
    jest.clearAllMocks();
  });

  it('returns the seeded matrix shape', async () => {
    repo.find.mockResolvedValue(seedRows());

    const result = await service.getMatrix();

    expect(result.roles).toEqual([...ROLE_MATRIX_ROLES]);
    expect(result.permissions).toEqual([...ROLE_MATRIX_PERMISSIONS]);
    expect(result.matrix.SUPER_ADMIN.every(Boolean)).toBe(true);
    expect(result.matrix.ADMIN[8]).toBe(false);
  });

  it('seeds defaults when the table is empty', async () => {
    repo.find.mockResolvedValueOnce([]);
    let id = 0;
    repo.save.mockImplementation(async (entity) => ({
      ...(entity as RolePermission),
      id: `generated-${id++}`,
      updated_at: new Date(),
    }));

    const result = await service.getMatrix();

    expect(repo.save).toHaveBeenCalled();
    expect(result.matrix.POLICE[2]).toBe(true);
  });

  it('updates allowed flags', async () => {
    repo.find
      .mockResolvedValueOnce(seedRows())
      .mockResolvedValue(seedRows());
    repo.findOne.mockResolvedValue({
      id: 'row-1',
      role: 'ADMIN',
      permission: 'API Keys',
      allowed: false,
      updated_at: new Date(),
    });

    await service.updateMatrix([
      { role: 'ADMIN', permission: 'API Keys', allowed: true },
    ]);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'ADMIN',
        permission: 'API Keys',
        allowed: true,
      }),
    );
  });

  it('rejects invalid permissions', async () => {
    await expect(
      service.updateMatrix([
        { role: 'ADMIN', permission: 'Not A Real Permission', allowed: true },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
