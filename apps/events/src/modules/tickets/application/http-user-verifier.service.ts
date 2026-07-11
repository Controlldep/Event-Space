import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { UserVerifier } from '@app/guards/interface/user-verifier';
import { AccessTokenDto } from '@app/guards/dto/access-token.dto';
import { UserDto } from '@app/guards/dto/user.dto';

@Injectable()
export class HttpUserVerifier implements UserVerifier {
  constructor(private readonly httpService: HttpService) {}

  async verify(payload: AccessTokenDto): Promise<UserDto> {
    const response = await lastValueFrom(
      this.httpService.get(`http://auth-service/internal/user/${payload.userId}`, {
        params: {
          deviceId: payload.deviceId,
        },
      }),
    );

    return response.data;
  }
}
