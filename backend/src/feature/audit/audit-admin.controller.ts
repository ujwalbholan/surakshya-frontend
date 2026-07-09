import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuditAction } from 'src/constants/audit.constants';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { AuditLogService } from './audit-log.service';

@ApiBearerAuth()
@ApiTags('Admin — Audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/audit')
export class AuditAdminController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @ApiOperation({ summary: 'List audit logs (paginated, filterable)' })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'actor_user_id', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'ISO 8601 start date' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'ISO 8601 end date' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  findAll(
    @Query('action') action?: AuditAction,
    @Query('actor_user_id') actor_user_id?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.auditLogService.findAll({
      action,
      actor_user_id,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page ?? 1,
      limit: limit ?? 20,
    });
  }

  @ApiOperation({ summary: 'Get an audit log by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditLogService.findOne(id);
  }
}
