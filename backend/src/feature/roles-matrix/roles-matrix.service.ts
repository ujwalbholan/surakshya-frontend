import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ROLE_MATRIX_DEFAULT,
  ROLE_MATRIX_PERMISSIONS,
  ROLE_MATRIX_ROLES,
} from 'src/constants/roles-matrix.constants';
import { RolePermission } from './entities/role-permission.entity';

@Injectable()
export class RolesMatrixService {
  constructor(
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
  ) {}

  async getMatrix() {
    let rows = await this.rolePermissionRepo.find({
      order: { role: 'ASC', permission: 'ASC' },
    });

    if (rows.length === 0) {
      rows = await this.seedDefaults();
    }

    const matrix: Record<string, boolean[]> = {};
    for (const role of ROLE_MATRIX_ROLES) {
      matrix[role] = ROLE_MATRIX_PERMISSIONS.map((permission) => {
        const row = rows.find(
          (r) => r.role === role && r.permission === permission,
        );
        return row?.allowed ?? false;
      });
    }

    return {
      message: 'Role permission matrix retrieved successfully',
      roles: [...ROLE_MATRIX_ROLES],
      permissions: [...ROLE_MATRIX_PERMISSIONS],
      matrix,
      entries: rows.map((r) => ({
        id: r.id,
        role: r.role,
        permission: r.permission,
        allowed: r.allowed,
        updated_at: r.updated_at,
      })),
    };
  }

  async updateMatrix(
    entries: Array<{ role: string; permission: string; allowed: boolean }>,
  ) {
    for (const entry of entries) {
      if (!ROLE_MATRIX_ROLES.includes(entry.role as (typeof ROLE_MATRIX_ROLES)[number])) {
        throw new BadRequestException(`Invalid role: ${entry.role}`);
      }
      if (
        !ROLE_MATRIX_PERMISSIONS.includes(
          entry.permission as (typeof ROLE_MATRIX_PERMISSIONS)[number],
        )
      ) {
        throw new BadRequestException(
          `Invalid permission: ${entry.permission}`,
        );
      }
    }

    for (const entry of entries) {
      let row = await this.rolePermissionRepo.findOne({
        where: { role: entry.role, permission: entry.permission },
      });

      if (!row) {
        row = this.rolePermissionRepo.create({
          role: entry.role,
          permission: entry.permission,
          allowed: entry.allowed,
        });
      } else {
        row.allowed = entry.allowed;
      }

      await this.rolePermissionRepo.save(row);
    }

    return this.getMatrix();
  }

  private async seedDefaults(): Promise<RolePermission[]> {
    const created: RolePermission[] = [];

    for (const role of ROLE_MATRIX_ROLES) {
      const flags = ROLE_MATRIX_DEFAULT[role];
      for (let i = 0; i < ROLE_MATRIX_PERMISSIONS.length; i++) {
        const entity = this.rolePermissionRepo.create({
          role,
          permission: ROLE_MATRIX_PERMISSIONS[i],
          allowed: flags[i],
        });
        created.push(await this.rolePermissionRepo.save(entity));
      }
    }

    return created;
  }
}
