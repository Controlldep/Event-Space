import { DataSource, QueryRunner } from 'typeorm';
import { TicketEntity } from '../../../domain/ticket.entity';
import type { ActiveUserData } from '../../../../../core/decorators/extract-user-from-request';
import { EventEntity } from '../../../../events/domain/event.entity';
import { CustomHttpException, DomainExceptionCode } from '../../../../../core/exceptions/domain.exceptions';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateTicketsCommand {
  constructor(
    public readonly user: ActiveUserData,
    public readonly eventId: string,
  ) {}
}

@CommandHandler(CreateTicketsCommand)
export class CreateTicketsUseCase implements ICommandHandler<CreateTicketsCommand> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(command: CreateTicketsCommand): Promise<TicketEntity> {
    const { user, eventId } = command;

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const findEvent: EventEntity | null = await queryRunner.manager.findOne(EventEntity, {
        where: { id: eventId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!findEvent) throw new CustomHttpException(DomainExceptionCode.NOT_FOUND);

      if (findEvent.startTime < new Date()) {
        throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'Вы опоздали! Ивент уже начался или прошел.');
      }

      if (findEvent.currentParticipantsCount >= findEvent.maxParticipants) {
        throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, `Нельзя купить билет, так как проданы уже все билеты`);
      }

      const findTicketForUser: TicketEntity | null = await queryRunner.manager.findOne(TicketEntity, {
        where: { userId: user.userId, eventId: eventId },
        lock: { mode: 'pessimistic_write' },
      });
      if (findTicketForUser) {
        throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, `Нельзя купить билет, так как вы его уже купили`);
      }

      const ticket: TicketEntity = TicketEntity.createInstance({
        eventId: eventId,
        userId: user.userId,
      });
      await queryRunner.manager.save(ticket);

      findEvent.currentParticipantsCount++;
      await queryRunner.manager.save(findEvent);

      await queryRunner.commitTransaction();
      return ticket;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
