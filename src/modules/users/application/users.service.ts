import { Injectable } from '@nestjs/common';
import { UserRepository } from '../infrastructure/user.repository';
import { UserEntity } from '../domain/user.entity';
import { UserInputDto } from '../api/input-dto/user.input.dto';
import { UpdateUserInputDto } from '../api/input-dto/update-user.input.dto';
import { DeleteResult, UpdateResult } from 'typeorm';
import { PasswordService } from './password.service';
import {
  CustomHttpException,
  DomainExceptionCode,
} from '../../../core/exceptions/domain.exceptions';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async getAllUsers(): Promise<UserEntity[]> {
    return await this.userRepository.getAllUsers();
  }

  async getUsersById(id: string): Promise<UserEntity | null> {
    return await this.userRepository.getUsersById(id);
  }

  async createUser(dto: UserInputDto): Promise<UserEntity> {
    const hashPassword: string = await this.passwordService.hashPassword(
      dto.password,
    );

    const user: UserEntity = UserEntity.createInstance({
      ...dto,
      password: hashPassword,
    });

    return await this.userRepository.saveUser(user);
  }

  async updateUser(id: string, dto: UpdateUserInputDto): Promise<UpdateResult> {
    const userInDb: UserEntity | null =
      await this.userRepository.getUsersById(id);
    if (!userInDb) throw new CustomHttpException(DomainExceptionCode.NOT_FOUND);

    if (dto.password || dto.oldPassword) {
      if (!dto.password || !dto.oldPassword) {
        throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST);
      }

      if (dto.password === dto.oldPassword) {
        throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST);
      }

      const isMatch: boolean = await this.passwordService.comparePassword(
        dto.oldPassword,
        userInDb.passwordHash,
      );
      if (!isMatch)
        throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST);

      (dto as any).passwordHash = await this.passwordService.hashPassword(
        dto.password,
      );

      delete dto.password;
      delete dto.oldPassword;
    }

    return await this.userRepository.updateUser(id, dto);
  }

  async deleteUser(id: string): Promise<DeleteResult> {
    return await this.userRepository.deleteUser(id);
  }
}
