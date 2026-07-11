import { AccessTokenDto } from '@app/guards/dto/access-token.dto';
import { UserDto } from '@app/guards/dto/user.dto';
import { SessionService } from './session.service';
import { UserVerifier } from '@app/guards/interface/user-verifier';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DbUserVerifier implements UserVerifier {
  constructor(private readonly sessionService: SessionService) {}

  async verify(payload: AccessTokenDto): Promise<UserDto | null> {
    return await this.sessionService.findSessionByDeviceIdAndUserId(payload.userId, payload.deviceId);
  }
}
