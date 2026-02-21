import { JwtService } from '../../jwt.service';
import { SessionService } from '../../session.service';
import jwt from 'jsonwebtoken';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

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
  ) {}

  async execute(command: RefreshSessionCommand) {
    const { userId, deviceId } = command;

    const accessToken: string = this.jwtService.createAccessToken(userId);
    const { refreshToken, hashJti } = await this.jwtService.createRefreshToken(userId, deviceId);

    const decoded: { exp: number } = jwt.decode(refreshToken) as { exp: number };
    await this.sessionService.updateSessionData(userId, deviceId, hashJti, decoded.exp);

    return { accessToken, refreshToken };
  }
}
