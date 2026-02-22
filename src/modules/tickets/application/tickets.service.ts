import { Injectable } from '@nestjs/common';
import { TicketsRepository } from '../repositories/tickets.repository';
import type { ActiveUserData } from '../../../core/decorators/extract-user-from-request';
import { CustomHttpException, DomainExceptionCode } from '../../../core/exceptions/domain.exceptions';
import { DataSource } from 'typeorm';
import { EventEntity } from '../../events/domain/event.entity';
import { TicketEntity } from '../domain/ticket.entity';

@Injectable()
export class TicketsService {
  constructor(
    private readonly ticketsRepository: TicketsRepository,
    private readonly dataSource: DataSource,
  ) {}

  async getMyTickets(id: string) {
    return await this.ticketsRepository.getMyTickets(id);
  }

  async createTicket(user: ActiveUserData, eventId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const findEvent = await queryRunner.manager.findOne(EventEntity, {
        where: { id: eventId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!findEvent) throw new CustomHttpException(DomainExceptionCode.NOT_FOUND);

      if (findEvent.startTime < new Date()) {
        throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'Вы опоздали! Ивент уже начался или прошел.');
      }

      const countTickets = await queryRunner.manager.count(TicketEntity, {
        where: { eventId: eventId },
      });
      if (countTickets >= findEvent.maxParticipants) {
        throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, `Нельзя купить билет, так как проданы уже все билеты`);
      }

      const findTicketForUser = await queryRunner.manager.findOne(TicketEntity, {
        where: { userId: user.userId, eventId: eventId },
        lock: { mode: 'pessimistic_write' },
      });
      if (findTicketForUser) {
        throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, `Нельзя купить билет, так как вы его уже купили`);
      }

      const ticket = TicketEntity.createInstance({
        eventId: eventId,
        userId: user.userId,
      });
      await queryRunner.manager.save(ticket);

      await queryRunner.commitTransaction();
      return ticket;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteTicket(id: string) {
    return await this.ticketsRepository.deleteTicket(id);
  }
}
