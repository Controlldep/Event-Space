import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ConfigService } from '@nestjs/config';
import { CustomHttpException, DomainExceptionCode } from '@app/exceptions/domain.exceptions';
import { SessionService } from '../../application/session.service';
import { SessionEntity } from '../../domain/session.entity';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(request: Request) => request?.cookies?.refreshToken || null]),
      secretOrKey: configService.get('JWT_SECRET_REFRESH')!,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: RefreshTokenDto) {
    if (!req.cookies?.refreshToken) throw new CustomHttpException(DomainExceptionCode.UNAUTHORIZED);

    const findRefreshToken: SessionEntity | null = await this.sessionService.findSessionByDeviceIdAndUserId(
      payload.userId,
      payload.deviceId,
    );
    if (!findRefreshToken) throw new CustomHttpException(DomainExceptionCode.UNAUTHORIZED);

    return { userId: payload.userId, deviceId: payload.deviceId };
  }
}
