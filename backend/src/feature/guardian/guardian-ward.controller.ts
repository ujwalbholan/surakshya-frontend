import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { GuardianService } from './guardian.service';
import { AddWardDto } from './dto/add-ward.dto';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { Role } from 'src/feature/auth/dto/auth.dto';

@ApiBearerAuth()
@ApiTags('Guardian (Ward)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('guardian')
export class GuardianWardController {
  constructor(private readonly guardianService: GuardianService) {}

  @ApiOperation({ summary: 'Get my ward info (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Roles('GUARDIAN')
  @Get('me')
  getMyWard(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const user = req.user as { userId: string };
    return this.guardianService.getMyWard(user.userId, {
      page: page ?? 1,
      limit: limit ?? 20,
    });
  }

  @ApiOperation({ summary: 'Send a request to add a child as ward' })
  @Roles('GUARDIAN')
  @Post('add-ward')
  addWard(@Req() req: Request, @Body() dto: AddWardDto) {
    const user = req.user as { userId: string };
    return this.guardianService.addWard(user.userId, dto);
  }

  @ApiOperation({ summary: 'Get my pending guardian requests' })
  @Roles('GUARDIAN')
  @Get('requests')
  getMyRequests(@Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    return this.guardianService.getMyRequests(user.userId, user.role as Role);
  }

  @ApiOperation({ summary: 'Accept a guardian request' })
  @Roles('GUARDIAN')
  @Post('requests/:id/accept')
  acceptRequest(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { userId: string };
    return this.guardianService.acceptRequest(id, user.userId);
  }

  @ApiOperation({ summary: 'Reject a guardian request' })
  @Roles('GUARDIAN')
  @Post('requests/:id/reject')
  rejectRequest(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { userId: string };
    return this.guardianService.rejectRequest(id, user.userId);
  }
}
