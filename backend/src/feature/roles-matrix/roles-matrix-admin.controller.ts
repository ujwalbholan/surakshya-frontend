import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { UpdateRoleMatrixDto } from './dto/update-role-matrix.dto';
import { RolesMatrixService } from './roles-matrix.service';

@ApiBearerAuth()
@ApiTags('Admin — Roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/roles')
export class RolesMatrixAdminController {
  constructor(private readonly rolesMatrixService: RolesMatrixService) {}

  @ApiOperation({ summary: 'Get role permission matrix (admin UI)' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get()
  getMatrix() {
    return this.rolesMatrixService.getMatrix();
  }

  @ApiOperation({
    summary: 'Update role permission matrix (SUPER_ADMIN only)',
  })
  @Roles('SUPER_ADMIN')
  @Put()
  updateMatrix(@Body() dto: UpdateRoleMatrixDto) {
    return this.rolesMatrixService.updateMatrix(dto.entries);
  }
}
