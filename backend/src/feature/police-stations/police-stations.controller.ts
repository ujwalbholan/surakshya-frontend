import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { PoliceStationsService } from './police-stations.service';
import { CreatePoliceStationDto } from './dto/create-police-station.dto';

@ApiBearerAuth()
@ApiTags('Admin — Police Stations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/police-stations')
export class PoliceStationsController {
  constructor(private readonly policeStationsService: PoliceStationsService) {}

  @ApiOperation({ summary: 'Create a police station' })
  @Post()
  create(@Body() dto: CreatePoliceStationDto) {
    return this.policeStationsService.create(dto);
  }

  @ApiOperation({ summary: 'List all police stations' })
  @Get()
  findAll() {
    return this.policeStationsService.findAll();
  }
}
