import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SessionService } from '../../application/session.service';
import { SessionEntity } from '../../domain/session.entity';
import { CustomHttpException, DomainExceptionCode } from '../../../../core/exceptions/domain.exceptions';
import { AccessTokenDto } from '../dto/access-token.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly sessionService: SessionService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: AccessTokenDto) {
    const findSession: SessionEntity | null = await this.sessionService.findSessionByDeviceIdAndUserId(payload.userId, payload.deviceId);
    if (!findSession) throw new CustomHttpException(DomainExceptionCode.UNAUTHORIZED);

    return { userId: payload.userId, deviceId: payload.deviceId };
  }
}
