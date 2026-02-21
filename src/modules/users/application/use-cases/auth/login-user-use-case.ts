import { UserRepository } from '../../../infrastructure/user.repository';
import { PasswordService } from '../../password.service';
import { JwtService } from '../../jwt.service';
import { SessionService } from '../../session.service';
import { UserEntity } from '../../../domain/user.entity';
import { CustomHttpException, DomainExceptionCode } from '../../../../../core/exceptions/domain.exceptions';
import { AuthUserInputDto } from '../../../api/input-dto/auth-user.input.dto';
import { Request } from 'express';
import { SessionInputDto } from '../../../domain/input-dto/session.input.dto';
import { createSession } from '../../../api/helpers/create-session';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class LoginUserCommand {
  constructor(
    public readonly data: AuthUserInputDto,
    public readonly req: Request,
  ) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase implements ICommandHandler<LoginUserCommand> {
  constructor(
    private readonly usersRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  async execute(command: LoginUserCommand) {
    const { data, req } = command;

    const user: UserEntity | null = await this.usersRepository.findUserByEmail(data.email);
    if (!user) throw new CustomHttpException(DomainExceptionCode.UNAUTHORIZED);

    const isPasswordValid: boolean = await this.passwordService.comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) throw new CustomHttpException(DomainExceptionCode.UNAUTHORIZED);

    const deviceId: string = await this.sessionService.getOrCreateDeviceId(req, user.id);
    const { refreshToken, hashJti } = await this.jwtService.createRefreshToken(user.id, deviceId);

    const createSessionForDb: SessionInputDto = createSession(req, deviceId, user.id, hashJti);
    await this.sessionService.saveSession(createSessionForDb);

    const accessToken = this.jwtService.createAccessToken(user.id);

    return { accessToken, refreshToken };
  }
}
