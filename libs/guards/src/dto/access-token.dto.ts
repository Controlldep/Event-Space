import { UserRole } from '../../../../apps/auth/src/domain/enum/user-role.type';

export interface AccessTokenDto {
  userId: string;
  deviceId: string;
  role: UserRole;
  iat: number;
  exp: number;
}
