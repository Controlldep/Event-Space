import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CustomHttpException, DomainExceptionCode } from '@app/exceptions/domain.exceptions';
import { type UserVerifier } from '@app/guards/interface/user-verifier';
import { UserDto } from '@app/guards/dto/user.dto';
import { USER_VERIFIER } from '@app/guards/user-verifier.token';
import { AccessTokenDto } from '@app/guards/dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(USER_VERIFIER) private readonly userVerifier: UserVerifier) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: AccessTokenDto) {
    const user: UserDto | null = await this.userVerifier.verify(payload);
    if (!user) throw new CustomHttpException(DomainExceptionCode.UNAUTHORIZED);
    return { userId: payload.userId, deviceId: payload.deviceId, role: payload.role };
  }
}
