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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { UnitStatus } from 'src/constants/patrol-units.constants';
import { PatrolUnitsService } from './patrol-units.service';
import { CreatePatrolUnitDto } from './dto/create-patrol-unit.dto';
import { UpdatePatrolUnitDto } from './dto/update-patrol-unit.dto';

@ApiBearerAuth()
@ApiTags('Admin — Units')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/units')
export class PatrolUnitsAdminController {
  constructor(private readonly patrolUnitsService: PatrolUnitsService) {}

  @ApiOperation({ summary: 'Create a patrol unit' })
  @Post()
  create(@Body() dto: CreatePatrolUnitDto) {
    return this.patrolUnitsService.create(dto);
  }

  @ApiOperation({ summary: 'List patrol units (paginated, filterable)' })
  @ApiQuery({ name: 'status', required: false, enum: UnitStatus })
  @ApiQuery({ name: 'station_id', required: false, type: String })
  @ApiQuery({ name: 'province', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  findAll(
    @Query('status') status?: UnitStatus,
    @Query('station_id') station_id?: string,
    @Query('province') province?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.patrolUnitsService.findAll({
      status,
      station_id,
      province,
      page: page ?? 1,
      limit: limit ?? 20,
    });
  }

  @ApiOperation({ summary: 'Update a patrol unit' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatrolUnitDto,
  ) {
    return this.patrolUnitsService.update(id, dto);
  }
}
