import { UserRepository } from '../../../../infrastructure/user.repository';
import { PasswordService } from '../../../password.service';
import { JwtService } from '../../../jwt.service';
import { SessionService } from '../../../session.service';
import { UserEntity } from '../../../../domain/user.entity';
import { AuthUserInputDto } from '../../../../api/input-dto/auth-user.input.dto';
import { SessionInputDto } from '../../../../domain/input-dto/session.input.dto';
import { createSession } from '../../../../api/helpers/create-session';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { createDeviceId } from '../../../../api/helpers/create-device-id';
import { SessionEntity } from '../../../../domain/session.entity';
import { UpdateUserSession } from '../../../helpers/update-session';
import { UpdateSessionDto } from '../../../dto/input/update-session.dto';
import { ConfigService } from '@nestjs/config';
import { DataSource, QueryRunner } from 'typeorm';
import { CustomHttpException, DomainExceptionCode } from '@app/exceptions/domain.exceptions';

export class LoginUserCommand {
  constructor(
    public readonly dto: AuthUserInputDto,
    public readonly ip: string,
    public readonly userAgent: string,
    public readonly deviceId: string | null,
  ) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase implements ICommandHandler<LoginUserCommand> {
  constructor(
    private readonly usersRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: LoginUserCommand) {
    const { dto, ip, userAgent } = command;
    let { deviceId } = command;

    const user: UserEntity | null = await this.usersRepository.findUserByEmail(dto.email);
    if (!user) throw new CustomHttpException(DomainExceptionCode.UNAUTHORIZED);

    const isPasswordValid: boolean = await this.passwordService.comparePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) throw new CustomHttpException(DomainExceptionCode.UNAUTHORIZED);

    let existingSession: SessionEntity | null = null;
    if (deviceId) {
      existingSession = await this.sessionService.findSessionByDeviceIdAndUserId(user.id, deviceId);
    }
    if (!existingSession) deviceId = createDeviceId();

    const refreshToken: string = this.jwtService.createRefreshToken(user.id, deviceId!);
    const refreshTokenHash: string = this.passwordService.hashRefreshToken(refreshToken);

    if (!existingSession) {
      const maxAge: string = this.configService.get<string>('MAX_AGE_REFRESH_TOKEN')!;

      const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const sessionDto: SessionInputDto = createSession(user.id, deviceId!, ip, userAgent, refreshTokenHash, maxAge);
        const sessionEntity: SessionEntity = SessionEntity.createInstance(sessionDto);
        await queryRunner.manager.save(sessionEntity);
        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    } else {
      const maxAge: string = this.configService.get<string>('MAX_AGE_REFRESH_TOKEN')!;
      const updateDto: UpdateSessionDto = UpdateUserSession(ip, userAgent, maxAge);
      await this.sessionService.updateSession(user.id, deviceId!, updateDto);
    }

    return { accessToken: await this.jwtService.createAccessToken(user.id, deviceId!, user.role), refreshToken, deviceId };
  }
}
