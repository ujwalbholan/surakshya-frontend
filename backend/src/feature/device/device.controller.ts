import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';

type AuthUser = { userId: string; role: string };

@ApiBearerAuth()
@ApiTags('Device')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @ApiOperation({
    summary: "Get the authenticated user's linked wearable status",
  })
  @Roles('USER', 'ADMIN', 'SUPER_ADMIN')
  @Get('mine')
  getMine(@Req() req: Request) {
    const user = req.user as AuthUser;
    return this.deviceService.getStatusForUser(user.userId);
  }

  @ApiOperation({ summary: 'Create a new device (admin)' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post()
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.deviceService.create(createDeviceDto);
  }

  @ApiOperation({ summary: 'List all devices (admin)' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get()
  findAll() {
    return this.deviceService.findAll();
  }

  @ApiOperation({ summary: 'Get device by ID (admin)' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.deviceService.findOne(id);
  }

  @ApiOperation({ summary: 'Update device by ID (admin)' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.deviceService.update(id, updateDeviceDto);
  }

  @ApiOperation({ summary: 'Delete device by ID (admin)' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.deviceService.remove(id);
  }
}
