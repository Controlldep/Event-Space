import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface ServiceTokenPayload {
  service: string;
  publicUserId: string;
}

@Injectable()
export class PaymentsJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.PAYMENTS_JWT_SECRET!,
    });
  }

  async validate(payload: ServiceTokenPayload): Promise<ServiceTokenPayload> {
    return {
      service: payload.service,
      publicUserId: payload.publicUserId,
    };
  }
}
