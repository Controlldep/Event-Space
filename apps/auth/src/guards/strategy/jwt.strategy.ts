import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SessionService } from '../../application/session.service';
import { SessionEntity } from '../../domain/session.entity';
import { AccessTokenDto } from '../dto/access-token.dto';
import { RedisService } from '@app/redis/redis.service';
import { CustomHttpException, DomainExceptionCode } from '@app/exceptions/domain.exceptions';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly sessionService: SessionService,
    private redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: AccessTokenDto) {
    const findInRedis: string | null = await this.redisService.get(payload.deviceId);
    if (!findInRedis) {
      const findSession: SessionEntity | null = await this.sessionService.findSessionByDeviceIdAndUserId(payload.userId, payload.deviceId);
      if (!findSession) throw new CustomHttpException(DomainExceptionCode.UNAUTHORIZED);
    }
    return { userId: payload.userId, deviceId: payload.deviceId, role: payload.role };
  }
}
