import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TicketsRepository } from '../../repositories/tickets.repository';
import { TicketEntity } from '../../domain/ticket.entity';

@Injectable()
export class CleanReservedTicketsCron {
  constructor(private readonly ticketsRepository: TicketsRepository) {}

  @Cron('*/5 * * * *')
  async handle() {
    const fifteenMinutesAgo: Date = new Date(Date.now() - 15 * 60 * 1000);

    const expiredTickets: TicketEntity[] = await this.ticketsRepository.findReservedTickets(fifteenMinutesAgo);

    for (const ticket of expiredTickets) {
      await this.ticketsRepository.removeReservedTicket(ticket);
      console.log(`Ticket ${ticket.id} removed due to timeout`);
    }
  }
}
