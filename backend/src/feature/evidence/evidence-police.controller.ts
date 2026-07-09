import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
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
import { EvidenceService } from './evidence.service';

@ApiBearerAuth()
@ApiTags('Police — Evidence')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('POLICE', 'ADMIN', 'SUPER_ADMIN')
@Controller('police/evidence')
export class EvidencePoliceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @ApiOperation({ summary: 'List evidence for the officer station' })
  @ApiQuery({ name: 'case_id', required: false, type: String })
  @ApiQuery({ name: 'file_type', required: false, enum: EvidenceFileType })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  findForStation(
    @Req() req: Request,
    @Query('case_id') case_id?: string,
    @Query('file_type') file_type?: EvidenceFileType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const user = req.user as { userId: string };
    return this.evidenceService.findForPolice(user.userId, {
      case_id,
      file_type,
      page: page ?? 1,
      limit: limit ?? 20,
    });
  }

  @ApiOperation({ summary: 'Get a station evidence record by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id')
  findOne(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    const user = req.user as { userId: string };
    return this.evidenceService.findOneForPolice(user.userId, id);
  }
}
