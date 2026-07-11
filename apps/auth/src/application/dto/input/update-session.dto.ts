export class UpdateSessionDto {
  ip: string;
  refreshTokenHash: string;
  userAgent: string;
  lastActiveDate: Date;
  expirationDate: Date;
}
