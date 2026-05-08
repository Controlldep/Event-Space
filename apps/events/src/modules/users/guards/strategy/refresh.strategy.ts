import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { SessionService } from '../../application/session.service';
import { CustomHttpException, DomainExceptionCode } from '../../../../core/exceptions/domain.exceptions';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { PasswordService } from '../../application/password.service';
import { SessionEntity } from '../../domain/session.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly sessionService: SessionService,
    private readonly passwordService: PasswordService,
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

    const refreshTokenHash: string = this.passwordService.hashRefreshToken(req.cookies.refreshToken);
    const findRefreshToken: SessionEntity | null = await this.sessionService.findSessionByDeviceIdAndUserId(
      payload.userId,
      payload.deviceId,
    );
    if (!findRefreshToken) throw new CustomHttpException(DomainExceptionCode.UNAUTHORIZED);

    if (refreshTokenHash !== findRefreshToken.refreshTokenHash) {
      await this.sessionService.deleteDeviceById(payload.userId, payload.deviceId);
      throw new CustomHttpException(DomainExceptionCode.FORBIDDEN);
    }

    return { userId: payload.userId, deviceId: payload.deviceId };
  }
}
