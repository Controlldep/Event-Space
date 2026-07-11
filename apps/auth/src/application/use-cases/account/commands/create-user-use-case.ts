import { UserRepository } from '../../../../infrastructure/user.repository';
import { PasswordService } from '../../../password.service';
import { UserEntity } from '../../../../domain/user.entity';
import { UserInputDto } from '../../../../api/input-dto/user.input.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateUserCommand {
  constructor(public readonly dto: UserInputDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserEntity> {
    const { dto } = command;
    const hashPassword: string = await this.passwordService.hashPassword(dto.password);

    const user: UserEntity = UserEntity.createInstance({
      ...dto,
      passwordHash: hashPassword,
    });

    return await this.userRepository.saveUser(user);
  }
}
