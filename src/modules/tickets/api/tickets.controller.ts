import { Controller, Delete, Get, Param } from '@nestjs/common';
import { TicketsService } from '../application/tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('/event/:id')
  async getAllTickets() {
    return await this.ticketsService.getAllTickets();
  }

  @Get('/my/:id')
  async getMyTickets(@Param('id') id: string) {
    return await this.ticketsService.getMyTickets(id);
  }

  @Delete(':id')
  async deleteTicket(@Param('id') id: string) {
    return await this.ticketsService.deleteTicket(id);
  }
}
