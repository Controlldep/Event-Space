import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller';
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
import { CreateUserUseCase } from './application/use-cases/account/commands/create-user-use-case';
import { UpdateUserUseCase } from './application/use-cases/account/commands/update-user-use-case';
import { DeleteUserUseCase } from './application/use-cases/account/commands/delete-user-use-case';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersQueryRepository } from './infrastructure/users-query.repository';
import { GetAllUsersQuery, GetAllUsersUseCase } from './application/use-cases/account/queries/get-all-users-use-case';
import { GetUsersByIdQuery, GetUsersByIdUseCase } from './application/use-cases/account/queries/get-users-by-id-use-case';

@Module({
  imports: [
    CqrsModule,
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
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
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
    UsersQueryRepository,
    GetAllUsersUseCase,
    GetUsersByIdUseCase,
  ],
  exports: [],
})
export class UsersModule {}
