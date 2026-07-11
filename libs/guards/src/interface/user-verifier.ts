import { AccessTokenDto } from '@app/guards/dto/access-token.dto';
import { UserDto } from '@app/guards/dto/user.dto';

export interface UserVerifier {
  verify(payload: AccessTokenDto): Promise<UserDto | null>;
}
