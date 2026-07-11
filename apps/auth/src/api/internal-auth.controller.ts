import { Controller, Get, Param, Query } from '@nestjs/common';
import { SessionService } from '../application/session.service';

@Controller('internal') // Префикс для "служебных" ручек
export class InternalAuthController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('users/:userId')
  async getUserInfo(@Param('userId') userId: string, @Query('deviceId') deviceId: string) {
    return await this.sessionService.findSessionByDeviceIdAndUserId(userId, deviceId);
  }
}
