import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../domain/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersQueryRepository {
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

    return findUserInDb;
  }
}
