import { Injectable } from '@nestjs/common';
import { UserRepository } from '../infrastructure/user.repository';
import { UserEntity } from '../domain/user.entity';
import { UserInputDto } from '../api/input-dto/user.input.dto';
import { UpdateUserInputDto } from '../api/input-dto/update-user.input.dto';
import { DeleteResult, UpdateResult } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async getAllUsers(): Promise<UserEntity[]> {
    return await this.userRepository.getAllUsers();
  }

  async getUsersById(id: string): Promise<UserEntity | null> {
    return await this.userRepository.getUsersById(id);
  }

  async createUser(dto: UserInputDto): Promise<UserEntity> {
    return await this.userRepository.createUser(dto);
  }

  async updateUser(id: string, dto: UpdateUserInputDto): Promise<UpdateResult> {
    return await this.userRepository.updateUser(id, dto);
  }

  async deleteUser(id: string): Promise<DeleteResult> {
    return await this.userRepository.deleteUser(id);
  }
}
