import { Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { type ActiveUserData, CurrentUser } from '../../../core/decorators/extract-user-from-request';
import { TicketEntity } from '../domain/ticket.entity';
import { BaseQueryParams } from '../../../core/dto/base.query.params';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateTicketsCommand } from '../application/use-case/command/create-tickets';
import { DeleteTicketCommand } from '../application/use-case/command/delete-ticket-use-case';
import { GetMyTicketsQuery } from '../application/use-case/query/get-my-tickets-use-case';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('myTickets')
  async getMyTickets(@CurrentUser() user: ActiveUserData, @Query() dto: BaseQueryParams): Promise<[TicketEntity[], number]> {
    return await this.queryBus.execute(new GetMyTicketsQuery(user.userId, dto));
  }

  @UseGuards(JwtAuthGuard)
  @Post(':eventId')
  async createTicket(@CurrentUser() user: ActiveUserData, @Param('eventId') eventId: string): Promise<TicketEntity> {
    return await this.commandBus.execute(new CreateTicketsCommand(user, eventId));
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteTicket(@CurrentUser() user: ActiveUserData, @Param('id') id: string): Promise<boolean> {
    return await this.commandBus.execute(new DeleteTicketCommand(user, id));
  }
}
