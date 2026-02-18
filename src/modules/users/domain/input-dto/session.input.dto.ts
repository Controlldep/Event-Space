export class SessionInputDto {
  userId: string;
  deviceId: string;
  ip: string;
  jtiHash: string;
  title: string;
  lastActiveDate: string;
  expirationDate: Date;
}
