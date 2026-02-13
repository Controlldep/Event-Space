import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../domain/user.entity';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { UpdateUserInputDto } from '../api/input-dto/update-user.input.dto';
import {
  CustomHttpException,
  DomainExceptionCode,
} from '../../../core/exceptions/domain.exceptions';

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
    const findUserInDb: UserEntity | null = await this.userRepository.findOne({
      where: { id: id },
    });
    if (!findUserInDb)
      throw new CustomHttpException(DomainExceptionCode.NOT_FOUND);
    return findUserInDb;
  }

  async saveUser(dto: UserEntity): Promise<UserEntity> {
    const user: UserEntity = this.userRepository.create(dto);
    const saveUser: UserEntity = await this.userRepository.save(user);
    return saveUser;
  }

  async updateUser(id: string, dto: UpdateUserInputDto): Promise<UpdateResult> {
    return await this.userRepository.update({ id }, dto);
  }

  async deleteUser(id: string): Promise<DeleteResult> {
    const result: DeleteResult = await this.userRepository.delete(id);
    if (result.affected === 0)
      throw new CustomHttpException(DomainExceptionCode.NOT_FOUND);
    return result;
  }
}
