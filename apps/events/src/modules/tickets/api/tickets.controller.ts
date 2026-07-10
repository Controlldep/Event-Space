import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { TicketEntity } from '../domain/ticket.entity';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { type ActiveUserData, CurrentUser } from '@app/decorators/extract-user-from-request';
import { BaseQueryParams } from '../../../core/dto/base.query.params';
import { GetMyTicketsQuery } from '../application/query/get-my-tickets-use-case';
import { CreateTicketsCommand } from '../application/use-case/command/create-tickets-use-case';
import { DeleteTicketCommand } from '../application/use-case/command/delete-ticket-use-case';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('myTickets')
  async getMyTickets(@CurrentUser() user: ActiveUserData, @Query() dto: BaseQueryParams): Promise<[TicketEntity[], number]> {
    return await this.queryBus.execute(new GetMyTicketsQuery(user.userId, dto));
  }

  @Post(':eventId')
  async createTicket(@CurrentUser() user: ActiveUserData, @Param('eventId') eventId: string): Promise<TicketEntity> {
    return await this.commandBus.execute(new CreateTicketsCommand(user, eventId));
  }

  @Delete(':id')
  async deleteTicket(@CurrentUser() user: ActiveUserData, @Param('id') id: string): Promise<boolean> {
    return await this.commandBus.execute(new DeleteTicketCommand(user, id));
  }
}
