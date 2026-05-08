export class SessionInputDto {
  userId: string;
  deviceId: string;
  ip: string;
  refreshTokenHash: string;
  userAgent: string;
  lastActiveDate: Date;
  expirationDate: Date;
}
