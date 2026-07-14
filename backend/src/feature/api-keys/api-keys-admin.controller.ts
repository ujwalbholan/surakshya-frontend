import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from './dto/api-key.dto';

@ApiBearerAuth()
@ApiTags('Admin — API Keys')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('admin/api-keys')
export class ApiKeysAdminController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @ApiOperation({ summary: 'List API keys (secrets never returned)' })
  @Get()
  findAll() {
    return this.apiKeysService.findAll();
  }

  @ApiOperation({
    summary: 'Create an API key (full secret returned once)',
  })
  @Post()
  create(@Body() dto: CreateApiKeyDto, @Req() req: Request) {
    const user = req.user as { userId: string };
    return this.apiKeysService.create(dto.name, user.userId);
  }

  @ApiOperation({ summary: 'Rename an API key' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateApiKeyDto) {
    if (!dto.name?.trim()) {
      throw new BadRequestException('name is required');
    }
    return this.apiKeysService.update(id, dto.name);
  }

  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Post(':id/revoke')
  revoke(@Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeysService.revoke(id);
  }
}
