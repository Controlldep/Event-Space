import { DataSource, LessThan, MoreThan, Not, QueryRunner } from 'typeorm';
import type { ActiveUserData } from '../../../../../core/decorators/extract-user-from-request';
import { CustomHttpException, DomainExceptionCode } from '../../../../../core/exceptions/domain.exceptions';
import { UserEntity } from '../../../../users/domain/user.entity';
import { EventEntity } from '../../../domain/event.entity';
import { UpdateEventDto } from '../../../api/input-dto/update-event.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class UpdateEventCommand {
  constructor(
    public readonly eventId: string,
    public readonly dto: UpdateEventDto,
    public readonly userData: ActiveUserData,
  ) {}
}

@CommandHandler(UpdateEventCommand)
export class UpdateEventUseCase implements ICommandHandler<UpdateEventCommand> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(command: UpdateEventCommand): Promise<EventEntity> {
    const { eventId, dto, userData } = command;
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const event: EventEntity | null = await queryRunner.manager.findOne(EventEntity, {
        where: { id: eventId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!event) throw new CustomHttpException(DomainExceptionCode.NOT_FOUND);
      if (event.organizerId !== userData.userId) throw new CustomHttpException(DomainExceptionCode.FORBIDDEN);

      await queryRunner.manager.findOne(UserEntity, {
        where: { id: event.organizerId },
      });

      if (dto.maxParticipants !== undefined && dto.maxParticipants < event.maxParticipants) {
        if (dto.maxParticipants < event.currentParticipantsCount) {
          throw new CustomHttpException(
            DomainExceptionCode.BAD_REQUEST,
            `Нельзя установить лимит ${dto.maxParticipants}, так как уже продано ${event.currentParticipantsCount} билетов`,
          );
        }
      }

      if (dto.startTime || dto.endTime) {
        const finalStart: number = dto.startTime ? new Date(dto.startTime).getTime() : event.startTime.getTime();
        const finalEnd: number = dto.endTime ? new Date(dto.endTime).getTime() : event.endTime.getTime();
        const HOUR_IN_MS: number = 60 * 60 * 1000;

        if (finalEnd <= finalStart) {
          throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'Конец события должен быть позже начала');
        }

        const conflict: EventEntity | null = await queryRunner.manager.findOne(EventEntity, {
          where: {
            organizerId: event.organizerId,
            id: Not(eventId),
            startTime: LessThan(new Date(finalEnd + HOUR_IN_MS)),
            endTime: MoreThan(new Date(finalStart - HOUR_IN_MS)),
          },
        });
        if (conflict) {
          throw new CustomHttpException(
            DomainExceptionCode.BAD_REQUEST,
            `Конфликт! Ивент "${conflict.title}" слишком близко. Нужен перерыв в 1 час.`,
          );
        }
      }

      queryRunner.manager.merge(EventEntity, event, dto);
      const savedEvent: EventEntity = await queryRunner.manager.save(event);

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
