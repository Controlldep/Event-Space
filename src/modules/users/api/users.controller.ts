import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { UsersService } from '../application/users.service';
import { UserEntity } from '../domain/user.entity';
import { UserInputDto } from './input-dto/user.input.dto';
import { UpdateUserInputDto } from './input-dto/update-user.input.dto';
import { DeleteResult, UpdateResult } from 'typeorm';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get()
  async getAllUsers(): Promise<UserEntity[]> {
    return await this.userService.getAllUsers();
  }

  @Get(':id')
  async getUsersById(@Param('id') id: string): Promise<UserEntity | null> {
    return await this.userService.getUsersById(id);
  }

  @Post()
  async createUser(@Body() dto: UserInputDto): Promise<UserEntity> {
    return await this.userService.createUser(dto);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserInputDto,
  ): Promise<UpdateResult> {
    return await this.userService.updateUser(id, dto);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<DeleteResult> {
    return await this.userService.deleteUser(id);
  }
}
