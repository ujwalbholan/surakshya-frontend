/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/utils/guard/jwt-auth.guard';
import type { Request } from 'express';
import { RolesGuard } from 'src/utils/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    return {
      message: 'Authenticated user',
      user: req.user,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin-only route (example)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin-only')
  adminOnly(@Req() req: any) {
    return {
      message: 'Only admin can access this route',
      user: req.user,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users except self (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.userService.findAll(user.userId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID (admin)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user by ID (admin)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user by ID (admin)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(id);
  }
}
