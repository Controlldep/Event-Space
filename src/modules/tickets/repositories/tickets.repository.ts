import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketEntity } from '../domain/ticket.entity';

@Injectable()
export class TicketsRepository {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketsRepository: Repository<TicketEntity>,
  ) {}

  async getAllTickets() {
    return await this.ticketsRepository.find();
  }

  async getMyTickets(id: string) {
    return await this.ticketsRepository.findOneBy({ id });
  }

  async createTicket(eventId: string) {
    // const saveEvent: TicketEntity = await this.ticketsRepository.save(eventId);
    // return saveEvent;
  }

  async deleteTicket(id: string) {
    return await this.ticketsRepository.delete(id);
  }
}
