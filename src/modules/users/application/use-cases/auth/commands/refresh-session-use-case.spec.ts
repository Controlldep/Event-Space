import { RefreshSessionCommand, RefreshSessionUseCase } from './refresh-session-use-case';
import { SessionService } from '../../../session.service';
import { PasswordService } from '../../../password.service';
import { JwtService } from '../../../jwt.service';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from 'src/redis/redis.service';

describe('RefreshSessionUseCase', () => {
  let useCase: RefreshSessionUseCase;
  let sessionService: SessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshSessionUseCase,
        {
          provide: JwtService,
          useValue: {
            createAccessToken: jest.fn(() => 'new-access'),
            createRefreshToken: jest.fn(() => 'new-refresh'),
          },
        },
        {
          provide: SessionService,
          useValue: { updateRefreshForSession: jest.fn() },
        },
        {
          provide: PasswordService,
          useValue: { hashRefreshToken: jest.fn(() => 'new-hash') },
        },
        {
          provide: RedisService,
          useValue: {
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<RefreshSessionUseCase>(RefreshSessionUseCase);
    sessionService = module.get<SessionService>(SessionService);
  });

  it('должен обновить токены и вызвать обновление сессии', async () => {
    const command = new RefreshSessionCommand('user-1', 'device-1');

    const result = await useCase.execute(command);

    expect(result).toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      deviceId: 'device-1',
    });

    expect(sessionService.updateRefreshForSession).toHaveBeenCalledWith('user-1', 'device-1', 'new-hash');
  });
});
