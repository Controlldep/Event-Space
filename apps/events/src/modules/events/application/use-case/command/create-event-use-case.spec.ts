import { DataSource } from 'typeorm';
import { CreateEventCommand, CreateEventUseCase } from './create-event-use-case';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../../../../users/domain/enum/user-role.type';
import { CustomHttpException, DomainExceptionCode } from '../../../../../../../../libs/exceptions/src/domain.exceptions';

describe('CreateEventUseCase', () => {
  let useCase: CreateEventUseCase;
  let dataSource: DataSource;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateEventUseCase,
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
      ],
    }).compile();

    useCase = module.get<CreateEventUseCase>(CreateEventUseCase);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('должен кинуть ошибку, если конец события раньше начала', async () => {
    const command = new CreateEventCommand(
      { userId: '1', role: UserRole.ORGANIZER } as any,
      { startTime: '2024-05-10T15:00:00', endTime: '2024-05-10T14:00:00' } as any,
    );

    await expect(useCase.execute(command)).rejects.toThrow(
      new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'Конец события должен быть позже начала'),
    );
  });

  it('должен кинуть ошибку, если пользователь не организатор', async () => {
    mockQueryRunner.manager.findOne.mockResolvedValue({ id: '1', role: UserRole.USER });

    const command = new CreateEventCommand(
      { userId: '1' } as any,
      { startTime: '2024-05-10T14:00:00', endTime: '2024-05-10T15:00:00' } as any,
    );

    await expect(useCase.execute(command)).rejects.toThrow(
      new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'Вы не являетесь организатором'),
    );

    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('должен кинуть ошибку, если есть конфликт расписания (нужен перерыв 1 час)', async () => {
    mockQueryRunner.manager.findOne.mockResolvedValue({ id: 'org-1', role: UserRole.ORGANIZER });

    mockQueryRunner.manager.find.mockResolvedValue([
      { title: 'Старое шоу', startTime: new Date('2024-05-10T12:00:00'), endTime: new Date('2024-05-10T13:30:00') },
    ]);

    const command = new CreateEventCommand(
      { userId: 'org-1' } as any,
      { title: 'Новое шоу', startTime: '2024-05-10T14:00:00', endTime: '2024-05-10T16:00:00' } as any,
    );

    await expect(useCase.execute(command)).rejects.toThrow(/Конфликт расписания/);
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
  });
});
