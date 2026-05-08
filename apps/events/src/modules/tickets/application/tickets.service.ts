import { Injectable } from '@nestjs/common';
import { TicketsRepository } from '../repositories/tickets.repository';
import { TicketEntity } from '../domain/ticket.entity';
import { BaseQueryParams } from '../../../core/dto/base.query.params';
import { GetAllTicketsWithPaginationDto } from '../repositories/dto/get-all-tickets-with-pagination.dto';

@Injectable()
export class TicketsService {
  constructor(private readonly ticketsRepository: TicketsRepository) {}

  async getMyTickets(userId: string, dto: BaseQueryParams): Promise<[TicketEntity[], number]> {
    const createDto: GetAllTicketsWithPaginationDto = {
      ...dto,
      userId,
    };
    return await this.ticketsRepository.getMyTickets(createDto);
  }
}
