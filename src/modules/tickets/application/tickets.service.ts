import { Injectable } from '@nestjs/common';
import { TicketsRepository } from '../repositories/tickets.repository';

@Injectable()
export class TicketsService {
  constructor(private readonly ticketsRepository: TicketsRepository) {}

  async getAllTickets() {
    return await this.ticketsRepository.getAllTickets();
  }

  async getMyTickets(id: string) {
    return await this.ticketsRepository.getMyTickets(id);
  }

  async createTicket(eventId: string) {
    return await this.ticketsRepository.createTicket(eventId);
  }

  async deleteTicket(id: string) {
    return await this.ticketsRepository.deleteTicket(id);
  }
}
