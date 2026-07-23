import { DataSource, QueryRunner } from 'typeorm';
import { TicketEntity } from '../../../domain/ticket.entity';
import { ActiveUserData } from '@app/decorators/extract-user-from-request';
import { EventEntity } from '../../../../events/domain/event.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomHttpException, DomainExceptionCode } from '@app/exceptions/domain.exceptions';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '@app/logger';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export class PurchaseTicketCommand {
  constructor(
    public readonly user: ActiveUserData,
    public readonly eventId: string,
  ) {}
}

@CommandHandler(PurchaseTicketCommand)
export class PurchaseTicketUseCase implements ICommandHandler<PurchaseTicketCommand> {
  constructor(
    private readonly dataSource: DataSource,
    @Inject('PAYMENTS_SERVICE') private readonly paymentsClient: ClientProxy,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(PurchaseTicketUseCase.name);
  }

  async execute(command: PurchaseTicketCommand): Promise<{ redirectUrl: string }> {
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

      try {
        const paymentResponse = await firstValueFrom(
          this.paymentsClient.send('payments.create-checkout-session', {
            userId: user.userId,
            eventId: eventId,
            price: findEvent.price,
            eventTitle: findEvent.title,
          }),
        );
        return { redirectUrl: paymentResponse.data.redirectUrl };
      } catch (err) {
        this.logger.error(err);
        await queryRunner.manager.delete(TicketEntity, { id: ticket.id });

        findEvent.currentParticipantsCount--;
        await queryRunner.manager.save(findEvent);

        throw new CustomHttpException(DomainExceptionCode.INTERNAL_SERVER_ERROR, 'Платежный сервис недоступен');
      }
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
