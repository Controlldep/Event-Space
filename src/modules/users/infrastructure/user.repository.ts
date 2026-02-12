import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../domain/user.entity';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { UserInputDto } from '../api/input-dto/user.input.dto';
import { UpdateUserInputDto } from '../api/input-dto/update-user.input.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async getAllUsers(): Promise<UserEntity[]> {
    return await this.userRepository.find();
  }

  async getUsersById(id: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ where: { id: id } });
  }

  async createUser(dto: UserInputDto): Promise<UserEntity> {
    const user: UserEntity = this.userRepository.create(dto);
    const saveUser: UserEntity = await this.userRepository.save(user);
    return saveUser;
  }

  async updateUser(id: string, dto: UpdateUserInputDto): Promise<UpdateResult> {
    return await this.userRepository.update({ id }, dto);
  }

  async deleteUser(id: string): Promise<DeleteResult> {
    return await this.userRepository.delete(id);
  }
}
