import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';

@ApiBearerAuth()
@ApiTags('Admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Get platform stats' })
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @ApiOperation({
    summary: 'List users with filters (paginated, excludes self)',
  })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'is_active', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('users')
  getUsers(
    @Req() req: Request,
    @Query('role') role?: string,
    @Query('is_active') is_active?: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const user = req.user as { userId: string };
    return this.adminService.getUsers({
      excludeUserId: user.userId,
      role,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      search,
      page: page ?? 1,
      limit: limit ?? 20,
    });
  }

  @ApiOperation({ summary: 'Get user details by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get('users/:id')
  getUserDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserDetails(id);
  }

  @ApiOperation({ summary: 'Update user active status' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch('users/:id/status')
  updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, dto);
  }

  @ApiOperation({ summary: 'Update user role' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch('users/:id/role')
  updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(id, dto);
  }

  @ApiOperation({ summary: 'List all devices (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('devices')
  getDevices(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.getDevices(page ?? 1, limit ?? 20);
  }

  @ApiOperation({ summary: 'List SOS events (paginated, filterable)' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'resolved'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('sos-events')
  getSosEvents(
    @Query('status') status?: 'active' | 'resolved',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.getSosEvents({
      status,
      page: page ?? 1,
      limit: limit ?? 20,
    });
  }

  @ApiOperation({ summary: 'Get SOS event details' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get('sos-events/:id')
  getSosEventDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getSosEventDetails(id);
  }

  @ApiOperation({ summary: 'Resolve an SOS event' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch('sos-events/:id/resolve')
  resolveSosEvent(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.resolveSosEvent(id);
  }
}
