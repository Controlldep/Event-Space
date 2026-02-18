import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from '../application/auth.service';
import { SessionService } from '../application/session.service';
import { Throttle } from '@nestjs/throttler';
import { CustomThrottlerGuard } from '../guards/trottler.guard';
import { AuthUserInputDto } from './input-dto/auth-user.input.dto';
import { AuthRegistrationUserInputDto } from './input-dto/auth-registration-user.input.dto';
import type { Request, Response } from 'express';
import { RefreshAuthGuard } from '../guards/refresh-auth.guard';
import { CurrentUser } from '../../../core/decorators/extract-user-from-request';
import type { ActiveUserData } from '../../../core/decorators/extract-user-from-request';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 10_000 } })
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: AuthUserInputDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(dto, req);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: Number(process.env.MAX_AGE_REFRESH_TOKEN) * 60 * 1000,
    });

    return { accessToken: accessToken };
  }

  @HttpCode(200)
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 10_000 } })
  @Post('registration')
  async registration(@Body() dto: AuthRegistrationUserInputDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.registerUser(dto);
    return this.login(dto, req, res);
  }

  @HttpCode(204)
  @UseGuards(RefreshAuthGuard)
  @Post('logout')
  async logOutHandler(@CurrentUser() user: ActiveUserData, @Res({ passthrough: true }) res: Response) {
    await this.sessionService.deleteDeviceById(user.userId, user.deviceId!);
    res.clearCookie('refreshToken', { httpOnly: true, secure: true });
  }

  @HttpCode(200)
  @UseGuards(RefreshAuthGuard)
  @Post('refresh-token')
  async refreshTokenHandler(@CurrentUser() user: ActiveUserData, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.refreshSession(user.userId, user.deviceId!);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: Number(process.env.MAX_AGE_REFRESH_TOKEN) * 60 * 1000,
    });

    return { accessToken };
  }

  @UseGuards(RefreshAuthGuard)
  @Get('session')
  async getAllSessions(@CurrentUser() user: ActiveUserData) {
    return await this.sessionService.getAllDevices(user.userId);
  }
}
