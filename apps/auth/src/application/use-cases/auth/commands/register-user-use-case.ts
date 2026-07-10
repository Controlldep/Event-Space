import { UserRepository } from '../../../../infrastructure/user.repository';
import { PasswordService } from '../../../password.service';
import { AuthRegistrationUserInputDto } from '../../../../api/input-dto/auth-registration-user.input.dto';
import { UserEntity } from '../../../../domain/user.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserDomainModel } from '../../../../domain/input-dto/user-domain.model';
import { DataSource, QueryRunner } from 'typeorm';
import { CustomHttpException, DomainExceptionCode } from '@app/exceptions/domain.exceptions';

export class RegisterUserCommand {
  constructor(public readonly user: AuthRegistrationUserInputDto) {}
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase implements ICommandHandler<RegisterUserCommand> {
  constructor(
    private readonly usersRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: RegisterUserCommand): Promise<UserEntity> {
    const { user } = command;

    const isEmailTaken: boolean = await this.usersRepository.existsByEmail(user.email);
    if (isEmailTaken) throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'User with this email already exists');

    const passwordHash: string = await this.passwordService.hashPassword(user.password);

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const domainModel: CreateUserDomainModel = {
        email: user.email.toLowerCase(),
        fullName: user.fullName,
        passwordHash,
        role: user.role,
      };
      const userEntity: UserEntity = UserEntity.createInstance(domainModel);
      const savedUser: UserEntity = await queryRunner.manager.save(userEntity);

      await queryRunner.commitTransaction();

      return savedUser;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
