import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { TicketsService } from '../application/tickets.service';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { type ActiveUserData, CurrentUser } from '../../../core/decorators/extract-user-from-request';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':eventId')
  async createTicket(@CurrentUser() user: ActiveUserData, @Param('eventId') eventId: string) {
    return await this.ticketsService.createTicket(user, eventId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/my/:id')
  async getMyTickets(@Param('id') id: string) {
    return await this.ticketsService.getMyTickets(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteTicket(@Param('id') id: string) {
    return await this.ticketsService.deleteTicket(id);
  }
}
