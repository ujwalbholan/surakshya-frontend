import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorators';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { BroadcastService } from './broadcast.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';

@ApiBearerAuth()
@ApiTags('Admin Broadcast')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/broadcast')
export class BroadcastAdminController {
  constructor(private readonly broadcastService: BroadcastService) {}

  @ApiOperation({ summary: 'Broadcast a message to police officers' })
  @Post()
  create(@Body() dto: CreateBroadcastDto) {
    return this.broadcastService.broadcast(dto);
  }
}
