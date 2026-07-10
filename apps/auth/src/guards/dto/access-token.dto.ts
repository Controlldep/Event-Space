import { UserRole } from '../../domain/enum/user-role.type';

export interface AccessTokenDto {
  userId: string;
  deviceId: string;
  role: UserRole;
  iat: number;
  exp: number;
}
