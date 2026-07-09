import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
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
import { CasePriority, CaseStatus } from 'src/constants/cases.constants';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import {
  CreateCaseNoteDto,
  UpdateCaseStatusDto,
} from './dto/update-case-status.dto';

@ApiBearerAuth()
@ApiTags('Admin — Cases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/cases')
export class CasesAdminController {
  constructor(private readonly casesService: CasesService) {}

  @ApiOperation({ summary: 'Create a case' })
  @Post()
  create(@Req() req: Request, @Body() dto: CreateCaseDto) {
    const user = req.user as { userId: string };
    return this.casesService.create(dto, user.userId);
  }

  @ApiOperation({ summary: 'List cases (paginated, filterable)' })
  @ApiQuery({ name: 'status', required: false, enum: CaseStatus })
  @ApiQuery({ name: 'priority', required: false, enum: CasePriority })
  @ApiQuery({ name: 'station_id', required: false, type: String })
  @ApiQuery({ name: 'province', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  findAll(
    @Query('status') status?: CaseStatus,
    @Query('priority') priority?: CasePriority,
    @Query('station_id') station_id?: string,
    @Query('province') province?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.casesService.findAll({
      status,
      priority,
      station_id,
      province,
      page: page ?? 1,
      limit: limit ?? 20,
    });
  }

  @ApiOperation({ summary: 'Update case status' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch(':id/status')
  updateStatus(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCaseStatusDto,
  ) {
    const user = req.user as { userId: string };
    return this.casesService.updateStatus(id, dto.status, user.userId);
  }

  @ApiOperation({ summary: 'Add a note to a case' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Post(':id/notes')
  addNote(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCaseNoteDto,
  ) {
    const user = req.user as { userId: string };
    return this.casesService.addNote(id, dto.body, user.userId);
  }

  @ApiOperation({ summary: 'Get a case by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.casesService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a case' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCaseDto,
  ) {
    const user = req.user as { userId: string };
    return this.casesService.update(id, dto, user.userId);
  }
}
