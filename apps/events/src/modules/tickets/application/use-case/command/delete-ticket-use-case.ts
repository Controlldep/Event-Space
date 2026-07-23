import { DataSource, QueryRunner } from 'typeorm';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TicketEntity } from '../../../domain/ticket.entity';
import { EventEntity } from '../../../../events/domain/event.entity';
import { ActiveUserData } from '@app/decorators/extract-user-from-request';
import { CustomHttpException, DomainExceptionCode } from '@app/exceptions/domain.exceptions';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '@app/logger';

export class DeleteTicketCommand {
  constructor(
    public readonly user: ActiveUserData,
    public readonly id: string,
  ) {}
}

@CommandHandler(DeleteTicketCommand)
export class DeleteTicketUseCase implements ICommandHandler<DeleteTicketCommand> {
  constructor(
    private readonly dataSource: DataSource,
    @Inject('PAYMENTS_SERVICE') private readonly paymentsClient: ClientProxy,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(DeleteTicketUseCase.name);
  }

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
      if (!findTicket) {
        throw new CustomHttpException(DomainExceptionCode.NOT_FOUND, 'Ticket not found');
      }

      const now = new Date();
      const hoursLeft = (findTicket.event.startTime.getTime() - now.getTime()) / 3600000;
      if (hoursLeft < 1) {
        throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'До начала события меньше часа');
      }

      const refund = await firstValueFrom(
        this.paymentsClient.send('payments.refund', {
          eventId: findTicket.eventId,
          userId: user.userId,
        }),
      );

      if (!refund.success) {
        throw new CustomHttpException(DomainExceptionCode.INTERNAL_SERVER_ERROR, 'Refund failed');
      }

      await queryRunner.manager.remove(findTicket);
      await queryRunner.manager.decrement(EventEntity, { id: findTicket.eventId }, 'currentParticipantsCount', 1);

      await queryRunner.commitTransaction();
      this.logger.log(`Ticket ${id} cancelled and refunded for user ${user.userId}`);
      return true;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to cancel ticket ${id}: ${err.message}`);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
