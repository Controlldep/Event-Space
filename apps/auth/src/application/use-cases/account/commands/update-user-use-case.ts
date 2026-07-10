import { UserRepository } from '../../../../infrastructure/user.repository';
import { PasswordService } from '../../../password.service';
import { UserEntity } from '../../../../domain/user.entity';
import { UpdateUserInputDto } from '../../../../api/input-dto/update-user.input.dto';
import { UpdateResult } from 'typeorm';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomHttpException, DomainExceptionCode } from '@app/exceptions/domain.exceptions';

export class UpdateUserCommand {
  constructor(
    public id: string,
    public dto: UpdateUserInputDto,
  ) {}
}

@CommandHandler(UpdateUserCommand)
export class UpdateUserUseCase implements ICommandHandler<UpdateUserCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(command: UpdateUserCommand): Promise<UpdateResult> {
    const { id, dto } = command;
    const userInDb: UserEntity | null = await this.userRepository.getUsersById(id);
    if (!userInDb) throw new CustomHttpException(DomainExceptionCode.NOT_FOUND);

    if (dto.password || dto.oldPassword) {
      if (!dto.password || !dto.oldPassword) {
        throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST);
      }

      if (dto.password === dto.oldPassword) {
        throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST);
      }

      const isMatch: boolean = await this.passwordService.comparePassword(dto.oldPassword, userInDb.passwordHash);
      if (!isMatch) throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST);

      (dto as any).passwordHash = await this.passwordService.hashPassword(dto.password);

      delete dto.password;
      delete dto.oldPassword;
    }
  //TODO ну здесь ваще борщ ебанный написан логика смешана переделать
    return await this.userRepository.updateUser(id, dto);
  }
}
