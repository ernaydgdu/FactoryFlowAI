import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { CreateUserDto, UpdateUserDto } from '../auth/dto/auth.dto';
import { CurrentUser, type JwtPayloadUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER')
  async getUsers(
    @CurrentUser() user: JwtPayloadUser,
    @Query('factoryId') factoryId?: string,
  ) {
    const scope = user.role === 'ADMIN' ? factoryId : user.factoryId;
    return this.usersService.getUsers(scope);
  }

  @Post()
  @Roles('ADMIN')
  async createUser(@Body() body: CreateUserDto) {
    return this.usersService.createUser(body);
  }

  @Patch(':id')
  @Roles('ADMIN')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, body);
  }
}
