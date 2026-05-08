import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CreateEventDto } from './input-dto/create-event.dto';
import { EventsService } from '../application/events.service';
import { type ActiveUserData, CurrentUser } from '../../../core/decorators/extract-user-from-request';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { QueryEventDto } from './input-dto/query-event.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateEventCommand } from '../application/use-case/command/create-event-use-case';
import { UpdateEventCommand } from '../application/use-case/command/update-event-use-case';
import { EventEntity } from '../domain/event.entity';
import { DeleteResult } from 'typeorm';
import { UpdateEventDto } from './input-dto/update-event.dto';
import { GetAllEventsQuery } from '../application/use-case/query/get-all-events-use-case';
import { GetEventByIdQuery } from '../application/use-case/query/get-event-by-id-use-case';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getAllEvents(@Query() dto: QueryEventDto) {
    return await this.queryBus.execute(new GetAllEventsQuery(dto));
  }

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
}
