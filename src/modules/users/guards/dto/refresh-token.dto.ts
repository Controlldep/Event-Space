export interface RefreshTokenDto {
  userId: string;
  deviceId: string;
  jti: string;
  iat: number;
  exp: number;
}
