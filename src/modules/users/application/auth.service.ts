import { Injectable } from '@nestjs/common';
import { UserRepository } from '../infrastructure/user.repository';
import { CustomHttpException, DomainExceptionCode } from '../../../core/exceptions/domain.exceptions';
import { AuthUserInputDto } from '../api/input-dto/auth-user.input.dto';
import { UserEntity } from '../domain/user.entity';
import { AuthRegistrationUserInputDto } from '../api/input-dto/auth-registration-user.input.dto';
import { PasswordService } from './password.service';
import { JwtService } from './jwt.service';
import jwt from 'jsonwebtoken';
import { SessionService } from './session.service';
import { SessionInputDto } from '../domain/input-dto/session.input.dto';
import { createSession } from '../api/helpers/create-session';
import { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  async registerUser(user: AuthRegistrationUserInputDto): Promise<UserEntity> {
    const findUserByEmail: UserEntity | null = await this.usersRepository.findUserByEmail(user.email);
    if (findUserByEmail) throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST);

    const passwordHash: string = await this.passwordService.hashPassword(user.password);
    const createUser: UserEntity = UserEntity.createInstance({
      ...user,
      password: passwordHash,
    });

    return await this.usersRepository.saveUser(createUser);
  }

  async refreshSession(userId: string, deviceId: string) {
    const accessToken: string = this.jwtService.createAccessToken(userId);
    const { refreshToken, hashJti } = await this.jwtService.createRefreshToken(userId, deviceId);

    const decoded: { exp: number } = jwt.decode(refreshToken) as { exp: number };
    await this.sessionService.updateSessionData(userId, deviceId, hashJti, decoded.exp);

    return { accessToken, refreshToken };
  }

  async login(data: AuthUserInputDto, req: Request) {
    const user: UserEntity | null = await this.usersRepository.findUserByEmail(data.email);
    if (!user) throw new CustomHttpException(DomainExceptionCode.UNAUTHORIZED);
    const isPasswordValid: boolean = await this.passwordService.comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) throw new CustomHttpException(DomainExceptionCode.UNAUTHORIZED);

    const deviceId: string = await this.sessionService.getOrCreateDeviceId(req, user.id);
    const { refreshToken, hashJti } = await this.jwtService.createRefreshToken(user.id, deviceId);

    const createSessionForDb: SessionInputDto = createSession(req, deviceId, user.id, hashJti);
    await this.sessionService.saveSession(createSessionForDb);
    console.log(createSessionForDb);

    const accessToken = this.jwtService.createAccessToken(user.id);

    return { accessToken, refreshToken };
  }
}
