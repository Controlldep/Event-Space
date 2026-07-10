import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UserEntity } from '../domain/user.entity';
import { UserInputDto } from './input-dto/user.input.dto';
import { UpdateUserInputDto } from './input-dto/update-user.input.dto';
import { DeleteResult, UpdateResult } from 'typeorm';
import { CreateUserCommand } from '../application/use-cases/account/commands/create-user-use-case';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UpdateUserCommand } from '../application/use-cases/account/commands/update-user-use-case';
import { DeleteUserCommand } from '../application/use-cases/account/commands/delete-user-use-case';
import { GetAllUsersQuery } from '../application/use-cases/account/queries/get-all-users-use-case';
import { GetUsersByIdQuery } from '../application/use-cases/account/queries/get-users-by-id-use-case';

@Controller('users')
export class UsersController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Get()
  async getAllUsers(): Promise<UserEntity[]> {
    return await this.queryBus.execute(new GetAllUsersQuery());
  }

  @Get(':id')
  async getUsersById(@Param('id') id: string): Promise<UserEntity | null> {
    return await this.queryBus.execute(new GetUsersByIdQuery(id));
  }

  @Post()
  async createUser(@Body() dto: UserInputDto): Promise<UserEntity> {
    return await this.commandBus.execute(new CreateUserCommand(dto));
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserInputDto): Promise<UpdateResult> {
    return await this.commandBus.execute(new UpdateUserCommand(id, dto));
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<DeleteResult> {
    return await this.commandBus.execute(new DeleteUserCommand(id));
  }
}
