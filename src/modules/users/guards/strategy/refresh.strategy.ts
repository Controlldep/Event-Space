import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { SessionService } from '../../application/session.service';
import { CustomHttpException, DomainExceptionCode } from '../../../../core/exceptions/domain.exceptions';
import { PasswordService } from '../../application/password.service';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly sessionService: SessionService,
    private readonly passwordService: PasswordService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(request: Request) => request?.cookies?.refreshToken || null]),
      secretOrKey: process.env.JWT_SECRET_REFRESH!,
    });
  }

  async validate(payload: RefreshTokenDto) {
    const session = await this.sessionService.findSessionByDeviceId(payload.deviceId);
    if (!session) throw new CustomHttpException(DomainExceptionCode.UNAUTHORIZED);

    const isJtiValid = await this.passwordService.comparePassword(payload.jti, session.jtiHash);
    if (!isJtiValid) {
      await this.sessionService.deleteDeviceById(payload.userId, payload.deviceId);
      throw new CustomHttpException(DomainExceptionCode.FORBIDDEN);
    }

    return { userId: payload.userId, deviceId: payload.deviceId, session };
  }
}
