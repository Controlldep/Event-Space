export interface RefreshTokenDto {
  userId: string;
  deviceId: string;
  iat: number;
  exp: number;
}
