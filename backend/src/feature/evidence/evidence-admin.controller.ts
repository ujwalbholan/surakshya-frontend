import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { EvidenceFileType } from 'src/constants/evidence.constants';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { EvidenceService } from './evidence.service';

@ApiBearerAuth()
@ApiTags('Admin — Evidence')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/evidence')
export class EvidenceAdminController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @ApiOperation({ summary: 'Create an evidence metadata record' })
  @Post()
  create(@Req() req: Request, @Body() dto: CreateEvidenceDto) {
    const user = req.user as { userId: string };
    return this.evidenceService.create(dto, user.userId);
  }

  @ApiOperation({ summary: 'List evidence records (paginated, filterable)' })
  @ApiQuery({ name: 'case_id', required: false, type: String })
  @ApiQuery({ name: 'file_type', required: false, enum: EvidenceFileType })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  findAll(
    @Query('case_id') case_id?: string,
    @Query('file_type') file_type?: EvidenceFileType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.evidenceService.findAll({
      case_id,
      file_type,
      page: page ?? 1,
      limit: limit ?? 20,
    });
  }

  @ApiOperation({ summary: 'Get an evidence record by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.evidenceService.findOne(id);
  }
}
