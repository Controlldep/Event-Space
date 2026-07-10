import { RegisterUserCommand, RegisterUserUseCase } from './register-user-use-case';
import { PasswordService } from '../../../password.service';
import { UserRepository } from '../../../../infrastructure/user.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../../../../domain/enum/user-role.type';
import { CustomHttpException, DomainExceptionCode } from '@app/exceptions/domain.exceptions';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let usersRepository: UserRepository;
  let passwordService: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        {
          provide: UserRepository,
          useValue: {
            existsByEmail: jest.fn(),
            saveUser: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hashPassword: jest.fn().mockResolvedValue('hashed_password'),
          },
        },
      ],
    }).compile();

    useCase = module.get<RegisterUserUseCase>(RegisterUserUseCase);
    usersRepository = module.get<UserRepository>(UserRepository);
    passwordService = module.get<PasswordService>(PasswordService);
  });

  const mockInput = {
    email: 'Vova@Example.com',
    password: 'securePassword',
    fullName: 'Vova K',
    role: UserRole.USER,
  };

  it('должен выбросить ошибку, если email занят', async () => {
    (usersRepository.existsByEmail as jest.Mock).mockResolvedValue(true);

    const command = new RegisterUserCommand(mockInput);

    await expect(useCase.execute(command)).rejects.toThrow(
      new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'User with this email already exists'),
    );

    expect(passwordService.hashPassword).not.toHaveBeenCalled();
  });

  it('должен создать юзера с маленьким email и зашифрованным паролем', async () => {
    (usersRepository.existsByEmail as jest.Mock).mockResolvedValue(false);
    (usersRepository.saveUser as jest.Mock).mockImplementation((user) => Promise.resolve(user));

    const command = new RegisterUserCommand(mockInput);
    const result = await useCase.execute(command);

    expect(result.email).toBe('vova@example.com'); // Приведение к нижнему регистру
    expect(passwordService.hashPassword).toHaveBeenCalledWith('securePassword');
    expect(usersRepository.saveUser).toHaveBeenCalled();
  });
});
