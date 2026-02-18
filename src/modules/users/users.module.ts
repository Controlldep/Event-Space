import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller';
import { UsersService } from './application/users.service';
import { UserRepository } from './infrastructure/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './domain/user.entity';
import { PasswordService } from './application/password.service';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SessionEntity } from './domain/session.entity';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { SessionService } from './application/session.service';
import { JwtService } from './application/jwt.service';
import { SessionRepository } from './infrastructure/session.repository';
import { JwtStrategy } from './guards/strategy/jwt.strategy';
import { RefreshStrategy } from './guards/strategy/refresh.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, SessionEntity]),
    PassportModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 10_000,
          limit: 5,
        },
      ],
    }),
  ],
  controllers: [UsersController, AuthController],
  providers: [
    UsersService,
    UserRepository,
    PasswordService,
    AuthService,
    SessionService,
    JwtService,
    SessionRepository,
    JwtStrategy,
    RefreshStrategy,
    JwtAuthGuard,
    RefreshAuthGuard,
    ThrottlerGuard,
  ],
  exports: [],
})
export class UsersModule {}
