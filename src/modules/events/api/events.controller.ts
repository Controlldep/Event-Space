import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CreateEventDto } from './input-dto/create-event.dto';
import { EventsService } from '../application/events.service';
import { type ActiveUserData, CurrentUser } from '../../../core/decorators/extract-user-from-request';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';

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

  @UseGuards(JwtAuthGuard)
  @Post()
  async createEvent(@CurrentUser() user: ActiveUserData, @Body() dto: CreateEventDto) {
    return await this.eventsService.createEvent(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async patchEvent(@CurrentUser() user: ActiveUserData, @Param('id') id: string, @Body() dto: CreateEventDto) {
    return await this.eventsService.updateEvent(id, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteEvent(@Param('id') id: string) {
    return await this.eventsService.deleteEvent(id);
  }
}
