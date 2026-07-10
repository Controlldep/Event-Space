import { LoginUserCommand, LoginUserUseCase } from './login-user-use-case';
import { UserRepository } from '../../../../infrastructure/user.repository';
import { PasswordService } from '../../../password.service';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '../../../jwt.service';
import { SessionService } from '../../../session.service';
import { ConfigService } from '@nestjs/config';
import { CustomHttpException, DomainExceptionCode } from '@app/exceptions/domain.exceptions';

jest.mock('../../../../api/helpers/create-device-id', () => ({
  createDeviceId: jest.fn(() => 'mocked-device-id'),
}));

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;
  let usersRepository: UserRepository;
  let passwordService: PasswordService;
  let sessionService: SessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUserUseCase,
        {
          provide: UserRepository,
          useValue: { findUserByEmail: jest.fn() },
        },
        {
          provide: PasswordService,
          useValue: {
            comparePassword: jest.fn(),
            hashRefreshToken: jest.fn(() => 'hashed_refresh_token'),
          },
        },
        {
          provide: JwtService,
          useValue: {
            createRefreshToken: jest.fn(() => 'test_refresh_token'),
            createAccessToken: jest.fn(() => 'test_access_token'),
          },
        },
        {
          provide: SessionService,
          useValue: {
            findSessionByDeviceIdAndUserId: jest.fn(),
            saveSession: jest.fn(),
            updateSession: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('7d') },
        },
      ],
    }).compile();

    useCase = module.get<LoginUserUseCase>(LoginUserUseCase);
    usersRepository = module.get<UserRepository>(UserRepository);
    passwordService = module.get<PasswordService>(PasswordService);
    sessionService = module.get<SessionService>(SessionService);
  });

  it('должен выбросить UNAUTHORIZED, если пользователь с таким email не найден', async () => {
    (usersRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);

    const command = new LoginUserCommand({ email: 'not-found@test.com', password: 'any-password' }, '127.0.0.1', 'Mozilla', 'device-123');

    await expect(useCase.execute(command)).rejects.toThrow(new CustomHttpException(DomainExceptionCode.UNAUTHORIZED));

    expect(passwordService.comparePassword).not.toHaveBeenCalled();
  });
  const mockUser = { id: 'user-123', email: 'test@test.com', passwordHash: 'hashed_password' };
  const mockSession = { id: 'sess-1', deviceId: 'device-123', userId: 'user-123' };

  it('должен выбросить UNAUTHORIZED, если пароль неверный', async () => {
    (usersRepository.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
    (passwordService.comparePassword as jest.Mock).mockResolvedValue(false);

    const command = new LoginUserCommand({ email: 'test@test.com', password: 'wrong-password' }, '1.1.1.1', 'Mozilla', 'dev-1');

    await expect(useCase.execute(command)).rejects.toThrow(new CustomHttpException(DomainExceptionCode.UNAUTHORIZED));

    expect(sessionService.findSessionByDeviceIdAndUserId).not.toHaveBeenCalled();
  });

  it('должен СОЗДАТЬ новую сессию, если deviceId не передан или сессия не найдена', async () => {
    (usersRepository.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
    (passwordService.comparePassword as jest.Mock).mockResolvedValue(true);

    (sessionService.findSessionByDeviceIdAndUserId as jest.Mock).mockResolvedValue(null);

    const command = new LoginUserCommand({ email: 'test@test.com', password: '123' }, '1.1.1.1', 'Mozilla', null);

    await useCase.execute(command);

    expect(sessionService.saveSession).toHaveBeenCalled();
    expect(sessionService.updateSession).not.toHaveBeenCalled();
  });

  it('должен ОБНОВИТЬ существующую сессию, если deviceId совпал', async () => {
    (usersRepository.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
    (passwordService.comparePassword as jest.Mock).mockResolvedValue(true);
    (sessionService.findSessionByDeviceIdAndUserId as jest.Mock).mockResolvedValue(mockSession);

    const command = new LoginUserCommand({ email: 'test@test.com', password: '123' }, '1.1.1.1', 'Mozilla', 'device-123');

    await useCase.execute(command);

    expect(sessionService.updateSession).toHaveBeenCalledWith(mockUser.id, 'device-123', expect.any(Object));
    expect(sessionService.saveSession).not.toHaveBeenCalled();
  });
});
