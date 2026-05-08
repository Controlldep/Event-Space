import { JwtService } from '../../../jwt.service';
import { SessionService } from '../../../session.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PasswordService } from '../../../password.service';
import { RedisService } from '../../../../../../redis/redis.service';

export class RefreshSessionCommand {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
  ) {}
}

@CommandHandler(RefreshSessionCommand)
export class RefreshSessionUseCase implements ICommandHandler<RefreshSessionCommand> {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly passwordService: PasswordService,
    private redisService: RedisService,
  ) {}

  async execute(command: RefreshSessionCommand) {
    const { userId, deviceId } = command;

    await this.redisService.del(deviceId);

    const accessToken: string = await this.jwtService.createAccessToken(userId, deviceId);
    const refreshToken: string = this.jwtService.createRefreshToken(userId, deviceId);
    const refreshTokenHash: string = this.passwordService.hashRefreshToken(refreshToken);

    await this.sessionService.updateRefreshForSession(userId, deviceId, refreshTokenHash);

    return { accessToken, refreshToken, deviceId };
  }
}
