import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionService } from 'src/modules/users/application/session.service';
import { RedisService } from 'src/redis/redis.service';

export class LogOutCommand {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
  ) {}
}

@CommandHandler(LogOutCommand)
export class LogOutUseCase implements ICommandHandler<LogOutCommand> {
  constructor(
    private readonly sessionService: SessionService,
    private readonly redisService: RedisService,
  ) {}

  async execute(command: LogOutCommand) {
    const { userId, deviceId } = command;

    await this.redisService.del(deviceId);

    await this.sessionService.deleteDeviceById(userId, deviceId);
  }
}
