import { Body, Controller, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { SessionService } from '../application/session.service';
import { Throttle } from '@nestjs/throttler';
import { CustomThrottlerGuard } from '../guards/trottler.guard';
import { AuthUserInputDto } from './input-dto/auth-user.input.dto';
import { AuthRegistrationUserInputDto } from './input-dto/auth-registration-user.input.dto';
import type { Response } from 'express';
import { RefreshAuthGuard } from '../guards/refresh-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { LoginUserCommand } from '../application/use-cases/auth/commands/login-user-use-case';
import { RegisterUserCommand } from '../application/use-cases/auth/commands/register-user-use-case';
import { RefreshSessionCommand } from '../application/use-cases/auth/commands/refresh-session-use-case';
import { IdentificationGuard } from '../guards/Identification.guard';
import ms, { StringValue } from 'ms';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GetProfileQuery } from '../application/use-cases/auth/query/get-profile-use-case';
import { UserEntity } from '../domain/user.entity';
import { SessionEntity } from '../domain/session.entity';
import { LogOutCommand } from '../application/use-cases/auth/commands/logout-use-case';
import { type ActiveUserData, CurrentUser } from '@app/decorators/extract-user-from-request';
import { GetUserIp } from '../core/decorators/get-user-ip';
import { GetUserAgent } from '../core/decorators/get-user-agent';
import { GetUserDeviceId } from '../core/decorators/get-user-device-id';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly commandBus: CommandBus,
    private readonly configService: ConfigService,
  ) {}

  @HttpCode(200)
  @UseGuards(CustomThrottlerGuard, IdentificationGuard)
  @Throttle({ default: { limit: 5, ttl: 10_000 } })
  @Post('registration')
  async registration(
    @Body() dto: AuthRegistrationUserInputDto,
    @GetUserIp() ip: string,
    @GetUserAgent() userAgent: string,
    @GetUserDeviceId() deviceId: string | null,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.commandBus.execute(new RegisterUserCommand(dto));
    return await this.login(dto, ip, userAgent, deviceId, res);
  }

  @UseGuards(CustomThrottlerGuard, IdentificationGuard)
  @Throttle({ default: { limit: 5, ttl: 10_000 } })
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: AuthUserInputDto,
    @GetUserIp() ip: string,
    @GetUserAgent() userAgent: string,
    @GetUserDeviceId() deviceId: string | null,
    @Res({ passthrough: true }) res: Response,
  ) {
    const {
      accessToken,
      refreshToken,
      deviceId: newDeviceId,
    } = await this.commandBus.execute(new LoginUserCommand(dto, ip, userAgent, deviceId));
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: ms(this.configService.get('MAX_AGE_REFRESH_TOKEN') as StringValue),
    });
    return { accessToken: accessToken, deviceId: newDeviceId };
  }

  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@CurrentUser() user: ActiveUserData): Promise<UserEntity | null> {
    return await this.commandBus.execute(new GetProfileQuery(user));
  }

  @HttpCode(200)
  @UseGuards(RefreshAuthGuard)
  @Post('refresh-token')
  async refreshTokenHandler(@CurrentUser() user: ActiveUserData, @Res({ passthrough: true }) res: Response) {
    const {
      accessToken,
      refreshToken,
      deviceId: newDeviceId,
    } = await this.commandBus.execute(new RefreshSessionCommand(user.userId, user.deviceId));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: ms(this.configService.get('MAX_AGE_REFRESH_TOKEN') as StringValue),
    });

    return { accessToken: accessToken, deviceId: newDeviceId };
  }

  @HttpCode(204)
  @UseGuards(RefreshAuthGuard)
  @Post('logout')
  async logOutHandler(@CurrentUser() user: ActiveUserData, @Res({ passthrough: true }) res: Response) {
    await this.commandBus.execute(new LogOutCommand(user.userId, user.deviceId));
    res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'strict' });
  }

  @UseGuards(RefreshAuthGuard)
  @Get('session')
  async getAllSessions(@CurrentUser() user: ActiveUserData): Promise<SessionEntity[]> {
    return await this.sessionService.getAllDevices(user.userId);
  }
}
