import { DataSource, QueryRunner } from 'typeorm';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TicketEntity } from '../../../domain/ticket.entity';
import { EventEntity } from '../../../../events/domain/event.entity';
import { ActiveUserData } from '@app/decorators/extract-user-from-request';
import { CustomHttpException, DomainExceptionCode } from '@app/exceptions/domain.exceptions';

export class DeleteTicketCommand {
  constructor(
    public readonly user: ActiveUserData,
    public readonly id: string,
  ) {}
}

@CommandHandler(DeleteTicketCommand)
export class DeleteTicketUseCase implements ICommandHandler<DeleteTicketCommand> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(command: DeleteTicketCommand): Promise<boolean> {
    const { user, id } = command;

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const findTicket = await queryRunner.manager.findOne(TicketEntity, {
        where: { id, userId: user.userId },
        relations: ['event'],
      });
      if (!findTicket) throw new CustomHttpException(DomainExceptionCode.NOT_FOUND);

      const now: Date = new Date();
      if (findTicket.event.startTime.getTime() - now.getTime() < 3600000) {
        throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'До начала меньше часа');
      }

      await queryRunner.manager.remove(findTicket);
      await queryRunner.manager.decrement(EventEntity, { id: findTicket.eventId }, 'currentParticipantsCount', 1);

      await queryRunner.commitTransaction();
      return true;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
