import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateEventDto } from './input-dto/create-event.dto';
import { EventsService } from '../application/events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getAllEvents() {
    return await this.eventsService.getAllEvents();
  }

  @Get(':id')
  async getEventById(@Param('id') id: string) {
    return await this.eventsService.getEventById(id);
  }

  @Post(':id')
  async createEvent(@Param('id') id: string, @Body() dto: CreateEventDto) {
    return await this.eventsService.createEvent(id, dto);
  }

  @Patch(':id')
  async patchEvent(@Param('id') id: string, @Body() dto: CreateEventDto) {
    return await this.eventsService.patchEvent(id, dto);
  }

  @Delete(':id')
  async deleteEvent(@Param('id') id: string) {
    return await this.eventsService.deleteEvent(id);
  }
}
