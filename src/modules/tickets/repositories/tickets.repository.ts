import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketEntity } from '../domain/ticket.entity';
import { GetAllTicketsWithPaginationDto } from './dto/get-all-tickets-with-pagination.dto';

@Injectable()
export class TicketsRepository {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketsRepository: Repository<TicketEntity>,
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
}
