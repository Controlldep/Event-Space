import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { TicketEntity, TicketStatus } from '../domain/ticket.entity';
import { GetAllTicketsWithPaginationDto } from './dto/get-all-tickets-with-pagination.dto';
import { EventEntity } from '../../events/domain/event.entity';

@Injectable()
export class TicketsRepository {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketsRepository: Repository<TicketEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getMyTickets(dto: GetAllTicketsWithPaginationDto): Promise<[TicketEntity[], number]> {
    const { userId, pageNumber, pageSize, sortDirection } = dto;

    return await this.ticketsRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.event', 'event')
      .where('ticket.userId = :userId', { userId })
      .orderBy('ticket.createdAt', sortDirection)
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
  }

  async updateStatus(userId: string, eventId: string) {
    await this.ticketsRepository.update({ userId, eventId }, { status: TicketStatus.PURCHASED });
  }

  async findReservedTickets(time: Date): Promise<TicketEntity[]> {
    return await this.ticketsRepository.find({
      where: {
        status: TicketStatus.RESERVED,
        reservedAt: LessThan(time),
      },
    });
  }

  async removeReservedTicket(ticket: TicketEntity): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.remove(ticket);

      await manager.decrement(EventEntity, { id: ticket.eventId }, 'currentParticipantsCount', 1);
    });
  }
}
