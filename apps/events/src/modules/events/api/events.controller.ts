import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CreateEventDto } from './input-dto/create-event.dto';
import { EventsService } from '../application/events.service';
import { QueryEventDto } from './input-dto/query-event.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateEventCommand } from '../application/use-case/command/create-event-use-case';
import { UpdateEventCommand } from '../application/use-case/command/update-event-use-case';
import { EventEntity } from '../domain/event.entity';
import { DeleteResult } from 'typeorm';
import { UpdateEventDto } from './input-dto/update-event.dto';
import { GetAllEventsQuery } from '../application/use-case/query/get-all-events-use-case';
import { GetEventByIdQuery } from '../application/use-case/query/get-event-by-id-use-case';
import { type ActiveUserData, CurrentUser } from '@app/decorators/extract-user-from-request';
import { PurchaseTicketCommand } from '../../tickets/application/use-case/command/purchase-ticket-use-case';
import { JwtAuthGuard } from '@app/guards';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllEvents(@Query() dto: QueryEventDto) {
    return await this.queryBus.execute(new GetAllEventsQuery(dto));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getEventById(@Param('id') id: string): Promise<EventEntity | null> {
    return await this.queryBus.execute(new GetEventByIdQuery(id));
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createEvent(@CurrentUser() user: ActiveUserData, @Body() dto: CreateEventDto): Promise<EventEntity> {
    return await this.commandBus.execute(new CreateEventCommand(user, dto));
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async patchEvent(@CurrentUser() user: ActiveUserData, @Param('id') id: string, @Body() dto: UpdateEventDto): Promise<EventEntity> {
    return await this.commandBus.execute(new UpdateEventCommand(id, dto, user));
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteEvent(@Param('id') id: string): Promise<DeleteResult> {
    return await this.eventsService.deleteEvent(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('purchase/:eventId')
  async purchaseTicket(@CurrentUser() user: ActiveUserData, @Param('eventId') eventId: string): Promise<{ redirectUrl: string }> {
    return await this.commandBus.execute(new PurchaseTicketCommand(user, eventId));
  }
}
