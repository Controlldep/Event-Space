import { DeleteTicketCommand, DeleteTicketUseCase } from './delete-ticket-use-case';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CustomHttpException, DomainExceptionCode } from '../../../../../core/exceptions/domain.exceptions';
import { EventEntity } from '../../../../events/domain/event.entity';

describe('DeleteTicketUseCase', () => {
  let useCase: DeleteTicketUseCase;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      remove: jest.fn(),
      decrement: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteTicketUseCase,
        {
          provide: DataSource,
          useValue: { createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner) },
        },
      ],
    }).compile();

    useCase = module.get<DeleteTicketUseCase>(DeleteTicketUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = { userId: 'user-123' } as any;
  const ticketId = 'ticket-001';

  it('должен выбросить NOT_FOUND, если билет не найден', async () => {
    mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);

    const command = new DeleteTicketCommand(mockUser, ticketId);

    await expect(useCase.execute(command)).rejects.toThrow(new CustomHttpException(DomainExceptionCode.NOT_FOUND));
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('должен выбросить BAD_REQUEST, если до начала ивента меньше часа', async () => {
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() + 30); // Ивент через 30 минут

    mockQueryRunner.manager.findOne.mockResolvedValueOnce({
      id: ticketId,
      event: { startTime: startTime },
    });

    const command = new DeleteTicketCommand(mockUser, ticketId);

    await expect(useCase.execute(command)).rejects.toThrow('До начала меньше часа');
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('должен успешно удалить билет и уменьшить счетчик участников', async () => {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 5); // Ивент через 5 часов (можно возвращать)

    const mockTicket = {
      id: ticketId,
      eventId: 'event-1',
      event: { startTime: startTime },
    };

    mockQueryRunner.manager.findOne.mockResolvedValueOnce(mockTicket);
    mockQueryRunner.manager.remove.mockResolvedValueOnce(mockTicket);
    mockQueryRunner.manager.decrement.mockResolvedValueOnce(undefined);

    const command = new DeleteTicketCommand(mockUser, ticketId);
    const result = await useCase.execute(command);

    // Проверяем вызовы
    expect(mockQueryRunner.manager.remove).toHaveBeenCalledWith(mockTicket);
    expect(mockQueryRunner.manager.decrement).toHaveBeenCalledWith(EventEntity, { id: 'event-1' }, 'currentParticipantsCount', 1);
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
