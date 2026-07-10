import { Test, TestingModule } from '@nestjs/testing';
import { UpdateEventCommand, UpdateEventUseCase } from './update-event-use-case';
import { DataSource } from 'typeorm';
import { CustomHttpException, DomainExceptionCode } from '../../../../../../../../libs/exceptions/src/domain.exceptions';

describe('UpdateEventUseCase', () => {
  let useCase: UpdateEventUseCase;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateEventUseCase,
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
      ],
    }).compile();

    useCase = module.get<UpdateEventUseCase>(UpdateEventUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockUserData = { userId: 'user-123' } as any;
  const eventId = 'event-999';

  it('должен выбросить NOT_FOUND, если ивент не существует', async () => {
    mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);

    const command = new UpdateEventCommand(eventId, {}, mockUserData);

    await expect(useCase.execute(command)).rejects.toThrow(new CustomHttpException(DomainExceptionCode.NOT_FOUND));
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('должен выбросить FORBIDDEN, если редактирует не организатор ивента', async () => {
    mockQueryRunner.manager.findOne.mockResolvedValueOnce({
      id: eventId,
      organizerId: 'someone-else',
    });

    const command = new UpdateEventCommand(eventId, {}, mockUserData);

    await expect(useCase.execute(command)).rejects.toThrow(new CustomHttpException(DomainExceptionCode.FORBIDDEN));
  });

  it('должен выбросить BAD_REQUEST, если лимит участников меньше уже проданных билетов', async () => {
    const existingEvent = {
      id: eventId,
      organizerId: mockUserData.userId,
      maxParticipants: 100,
      currentParticipantsCount: 80,
    };

    mockQueryRunner.manager.findOne.mockResolvedValueOnce(existingEvent);
    mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: mockUserData.userId });

    const command = new UpdateEventCommand(eventId, { maxParticipants: 50 }, mockUserData);

    await expect(useCase.execute(command)).rejects.toThrow(
      new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'Нельзя установить лимит 50, так как уже продано 80 билетов'),
    );
  });

  it('должен выбросить BAD_REQUEST, если есть конфликт времени с другим ивентом', async () => {
    const existingEvent = {
      id: eventId,
      organizerId: mockUserData.userId,
      startTime: new Date('2026-05-10T10:00:00'),
      endTime: new Date('2026-05-10T12:00:00'),
    };

    mockQueryRunner.manager.findOne.mockResolvedValueOnce(existingEvent); // Текущий ивент
    mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: mockUserData.userId }); // Юзер
    mockQueryRunner.manager.findOne.mockResolvedValueOnce({ title: 'Другой ивент' }); // Конфликт найден!

    const command = new UpdateEventCommand(
      eventId,
      {
        startTime: new Date('2026-05-10T14:00:00'),
        endTime: new Date('2026-05-10T16:00:00'),
      },
      mockUserData,
    );

    await expect(useCase.execute(command)).rejects.toThrow(/Конфликт! Ивент "Другой ивент" слишком близко/);
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('должен успешно обновить ивент при валидных данных', async () => {
    const existingEvent = {
      id: eventId,
      organizerId: mockUserData.userId,
      startTime: new Date('2026-05-10T10:00:00'),
      endTime: new Date('2026-05-10T12:00:00'),
      maxParticipants: 100,
      currentParticipantsCount: 10,
    };
    const updateDto = { title: 'Новое название' };

    mockQueryRunner.manager.findOne.mockResolvedValueOnce(existingEvent);
    mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: mockUserData.userId });
    mockQueryRunner.manager.findOne.mockResolvedValueOnce(null); // Конфликтов нет
    mockQueryRunner.manager.save.mockResolvedValue({ ...existingEvent, ...updateDto });

    const command = new UpdateEventCommand(eventId, updateDto, mockUserData);
    const result = await useCase.execute(command);

    expect(mockQueryRunner.manager.merge).toHaveBeenCalled();
    expect(result.title).toBe('Новое название');
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
  });
});
