import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
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
import { UpdateCaseDto } from './dto/update-case.dto';

@ApiBearerAuth()
@ApiTags('Police — Cases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('POLICE', 'ADMIN', 'SUPER_ADMIN')
@Controller('police/cases')
export class CasesPoliceController {
  constructor(private readonly casesService: CasesService) {}

  @ApiOperation({ summary: 'List cases for the officer station' })
  @ApiQuery({ name: 'status', required: false, enum: CaseStatus })
  @ApiQuery({ name: 'priority', required: false, enum: CasePriority })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  findForStation(
    @Req() req: Request,
    @Query('status') status?: CaseStatus,
    @Query('priority') priority?: CasePriority,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const user = req.user as { userId: string };
    return this.casesService.findForPolice(user.userId, {
      status,
      priority,
      page: page ?? 1,
      limit: limit ?? 20,
    });
  }

  @ApiOperation({ summary: 'Get a station case by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id')
  findOne(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    const user = req.user as { userId: string };
    return this.casesService.findOneForPolice(user.userId, id);
  }

  @ApiOperation({ summary: 'Update a station case' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCaseDto,
  ) {
    const user = req.user as { userId: string };
    return this.casesService.updateForPolice(user.userId, id, dto);
  }
}
