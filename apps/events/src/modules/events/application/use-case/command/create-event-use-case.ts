import { DataSource, LessThan, MoreThan, QueryRunner } from 'typeorm';
import { CreateEventDto } from '../../../api/input-dto/create-event.dto';
import { EventEntity } from '../../../domain/event.entity';
import { TicketEntity } from '../../../../tickets/domain/ticket.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomHttpException, DomainExceptionCode } from '@app/exceptions/domain.exceptions';
import { ActiveUserData } from '@app/decorators/extract-user-from-request';
import { UserRole } from '../../../../../../../auth/src/domain/enum/user-role.type';

export class CreateEventCommand {
  constructor(
    public readonly userData: ActiveUserData,
    public readonly dto: CreateEventDto,
  ) {}
}

@CommandHandler(CreateEventCommand)
export class CreateEventUseCase implements ICommandHandler<CreateEventCommand> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(command: CreateEventCommand): Promise<EventEntity> {
    const { userData, dto } = command;
    const newStart: number = new Date(dto.startTime).getTime();
    const newEnd: number = new Date(dto.endTime).getTime();
    const HOUR_IN_MS: number = 60 * 60 * 1000;

    if (newEnd <= newStart) {
      throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'Конец события должен быть позже начала');
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (userData.role !== UserRole.ORGANIZER) {
        throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'Вы не являетесь организатором');
      }

      const bufferStart: Date = new Date(newStart - HOUR_IN_MS);
      const bufferEnd: Date = new Date(newEnd + HOUR_IN_MS);

      const otherEvents: EventEntity[] = await queryRunner.manager.find(EventEntity, {
        where: {
          organizerId: userData.userId,
          endTime: MoreThan(bufferStart),
          startTime: LessThan(bufferEnd),
        },
      });

      for (const event of otherEvents) {
        const oStart: number = new Date(event.startTime).getTime();
        const oEnd: number = new Date(event.endTime).getTime();

        const hasOverlap: boolean = newStart < oEnd + HOUR_IN_MS && newEnd > oStart - HOUR_IN_MS;

        if (hasOverlap) {
          throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, `Конфликт расписания: "${event.title}". Нужен перерыв в 1 час.`);
        }
      }

      const eventInstance: EventEntity = EventEntity.createInstance(dto, userData.userId);
      const savedEvent: EventEntity = await queryRunner.manager.save(eventInstance);

      const organizerTicket: TicketEntity = TicketEntity.createInstance({
        eventId: savedEvent.id,
        userId: userData.userId,
      });
      await queryRunner.manager.save(organizerTicket);

      await queryRunner.commitTransaction();
      return savedEvent;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
