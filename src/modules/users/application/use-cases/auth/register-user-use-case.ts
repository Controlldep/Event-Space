import { UserRepository } from '../../../infrastructure/user.repository';
import { PasswordService } from '../../password.service';
import { AuthRegistrationUserInputDto } from '../../../api/input-dto/auth-registration-user.input.dto';
import { UserEntity } from '../../../domain/user.entity';
import { CustomHttpException, DomainExceptionCode } from '../../../../../core/exceptions/domain.exceptions';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserDomainModel } from '../../../domain/input-dto/user-domain.model';

export class RegisterUserCommand {
  constructor(public readonly user: AuthRegistrationUserInputDto) {}
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase implements ICommandHandler<RegisterUserCommand> {
  constructor(
    private readonly usersRepository: UserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(command: RegisterUserCommand): Promise<UserEntity> {
    const { user } = command;

    const isEmailTaken: boolean = await this.usersRepository.existsByEmail(user.email);
    if (isEmailTaken) throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST);

    const passwordHash: string = await this.passwordService.hashPassword(user.password);
    const domainModel: CreateUserDomainModel = {
      email: user.email.toLowerCase(),
      fullName: user.fullName,
      passwordHash,
      role: user.role,
    };

    const userEntity: UserEntity = UserEntity.createInstance(domainModel);
    console.log(userEntity);
    try {
      return await this.usersRepository.saveUser(userEntity);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST);
      }
      throw error;
    }
  }
}
