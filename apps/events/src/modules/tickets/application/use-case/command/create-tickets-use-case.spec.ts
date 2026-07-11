import { CreateTicketsCommand, CreateTicketsUseCase } from './create-tickets-use-case';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CustomHttpException, DomainExceptionCode } from '../../../../../core/exceptions/domain.exceptions';

describe('CreateTicketsUseCase', () => {
  let useCase: CreateTicketsUseCase;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      save: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTicketsUseCase,
        {
          provide: DataSource,
          useValue: { createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner) },
        },
      ],
    }).compile();

    useCase = module.get<CreateTicketsUseCase>(CreateTicketsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = { userId: 'user-1' } as any;
  const eventId = 'event-1';

  it('должен выбросить NOT_FOUND, если ивента нет', async () => {
    mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);

    const command = new CreateTicketsCommand(mockUser, eventId);

    await expect(useCase.execute(command)).rejects.toThrow(new CustomHttpException(DomainExceptionCode.NOT_FOUND));
  });

  it('должен выбросить BAD_REQUEST, если ивент уже начался', async () => {
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1); // Год назад

    mockQueryRunner.manager.findOne.mockResolvedValueOnce({ startTime: pastDate });

    const command = new CreateTicketsCommand(mockUser, eventId);

    await expect(useCase.execute(command)).rejects.toThrow('Вы опоздали!');
  });

  it('должен выбросить BAD_REQUEST, если билеты закончились', async () => {
    mockQueryRunner.manager.findOne.mockResolvedValueOnce({
      startTime: new Date(Date.now() + 100000), // В будущем
      currentParticipantsCount: 50,
      maxParticipants: 50,
    });

    const command = new CreateTicketsCommand(mockUser, eventId);

    await expect(useCase.execute(command)).rejects.toThrow('проданы уже все билеты');
  });

  it('должен выбросить BAD_REQUEST, если пользователь уже купил билет', async () => {
    mockQueryRunner.manager.findOne.mockResolvedValueOnce({
      startTime: new Date(Date.now() + 100000),
      currentParticipantsCount: 10,
      maxParticipants: 50,
    });
    // Второй findOne возвращает уже существующий билет
    mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 'ticket-already-exists' });

    const command = new CreateTicketsCommand(mockUser, eventId);

    await expect(useCase.execute(command)).rejects.toThrow('вы его уже купили');
  });

  it('должен успешно создать билет и инкрементировать счетчик ивента', async () => {
    const mockEvent = {
      id: eventId,
      startTime: new Date(Date.now() + 100000),
      currentParticipantsCount: 10,
      maxParticipants: 50,
    };

    mockQueryRunner.manager.findOne.mockResolvedValueOnce(mockEvent); // Ивент найден
    mockQueryRunner.manager.findOne.mockResolvedValueOnce(null); // Билета у юзера нет
    mockQueryRunner.manager.save.mockImplementation(async (entity) => entity);

    const command = new CreateTicketsCommand(mockUser, eventId);
    await useCase.execute(command);

    // Проверяем, что счетчик увеличился
    expect(mockEvent.currentParticipantsCount).toBe(11);

    // Проверяем, что сохранили и билет, и обновленный ивент
    expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(2);
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
  });
});
