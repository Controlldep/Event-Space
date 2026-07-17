import { Controller, Delete, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TicketEntity } from '../domain/ticket.entity';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { type ActiveUserData, CurrentUser } from '@app/decorators/extract-user-from-request';
import { BaseQueryParams } from '../../../core/dto/base.query.params';
import { GetMyTicketsQuery } from '../application/query/get-my-tickets-use-case';
import { DeleteTicketCommand } from '../application/use-case/command/delete-ticket-use-case';
import { JwtAuthGuard } from '@app/guards';

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
  @Delete(':id')
  async deleteTicket(@CurrentUser() user: ActiveUserData, @Param('id') id: string): Promise<boolean> {
    return await this.commandBus.execute(new DeleteTicketCommand(user, id));
  }
}
