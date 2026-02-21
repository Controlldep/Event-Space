import { UserRepository } from '../../../infrastructure/user.repository';
import { PasswordService } from '../../password.service';
import { AuthRegistrationUserInputDto } from '../../../api/input-dto/auth-registration-user.input.dto';
import { UserEntity } from '../../../domain/user.entity';
import { CustomHttpException, DomainExceptionCode } from '../../../../../core/exceptions/domain.exceptions';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class RegistrationUserCommand {
  constructor(public readonly user: AuthRegistrationUserInputDto) {}
}

@CommandHandler(RegistrationUserCommand)
export class RegistrationUserUseCase implements ICommandHandler<RegistrationUserCommand> {
  constructor(
    private readonly usersRepository: UserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(command: RegistrationUserCommand): Promise<UserEntity> {
    const { user } = command;

    const findUserByEmail: UserEntity | null = await this.usersRepository.findUserByEmail(user.email);
    if (findUserByEmail) throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST);

    const passwordHash: string = await this.passwordService.hashPassword(user.password);
    const createUser: UserEntity = UserEntity.createInstance({
      ...user,
      password: passwordHash,
    });

    return await this.usersRepository.saveUser(createUser);
  }
}
