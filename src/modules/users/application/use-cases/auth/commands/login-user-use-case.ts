import { UserRepository } from '../../../../infrastructure/user.repository';
import { PasswordService } from '../../../password.service';
import { JwtService } from '../../../jwt.service';
import { SessionService } from '../../../session.service';
import { UserEntity } from '../../../../domain/user.entity';
import { CustomHttpException, DomainExceptionCode } from '../../../../../../core/exceptions/domain.exceptions';
import { AuthUserInputDto } from '../../../../api/input-dto/auth-user.input.dto';
import { SessionInputDto } from '../../../../domain/input-dto/session.input.dto';
import { createSession } from '../../../../api/helpers/create-session';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { createDeviceId } from '../../../../api/helpers/create-device-id';
import { SessionEntity } from '../../../../domain/session.entity';
import { UpdateUserSession } from '../../../helpers/update-session';
import { UpdateSessionDto } from '../../../dto/input/update-session.dto';
import { ConfigService } from '@nestjs/config';

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
      const sessionDto: SessionInputDto = createSession(user.id, deviceId!, ip, userAgent, refreshTokenHash, maxAge);
      await this.sessionService.saveSession(sessionDto);
    } else {
      const maxAge: string = this.configService.get<string>('MAX_AGE_REFRESH_TOKEN')!;
      const updateDto: UpdateSessionDto = UpdateUserSession(ip, userAgent, refreshTokenHash, maxAge);
      await this.sessionService.updateSession(user.id, deviceId!, updateDto);
    }

    return { accessToken: this.jwtService.createAccessToken(user.id, deviceId!), refreshToken, deviceId };
  }
}
