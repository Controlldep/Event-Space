import { JwtService } from '../../../jwt.service';
import { SessionService } from '../../../session.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RedisService } from '@app/redis/redis.service';
import jwt from 'jsonwebtoken';

export class RefreshSessionCommand {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
    public readonly role: string,
  ) {}
}

@CommandHandler(RefreshSessionCommand)
export class RefreshSessionUseCase implements ICommandHandler<RefreshSessionCommand> {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private redisService: RedisService,
  ) {}

  async execute(command: RefreshSessionCommand) {
    const { userId, deviceId, role } = command;

    await this.redisService.del(deviceId);

    const accessToken: string = await this.jwtService.createAccessToken(userId, deviceId, role);
    const refreshToken: string = this.jwtService.createRefreshToken(userId, deviceId);
    const decoded = jwt.decode(refreshToken) as { exp: number };

    if (decoded && decoded.exp) {
      const expirationDate = new Date(decoded.exp * 1000);
      console.log('Токен протухнет в:', expirationDate);
    }

    await this.sessionService.updateRefreshForSession(userId, deviceId, decoded.exp);

    return { accessToken, refreshToken, deviceId };
  }
}
