import { Injectable } from '@nestjs/common';
import { CreateEventDto } from '../api/input-dto/create-event.dto';
import { EventsRepository } from '../infrastructure/events.repository';

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async getAllEvents() {
    return await this.eventsRepository.getAllEvents();
  }

  async getEventById(id: string) {
    return await this.eventsRepository.getEventById(id);
  }

  async createEvent(id: string, dto: CreateEventDto) {
    return await this.eventsRepository.createEvent(id, dto);
  }

  async patchEvent(id: string, dto: CreateEventDto) {
    return await this.eventsRepository.patchEvent(id, dto);
  }

  async deleteEvent(id: string) {
    return await this.eventsRepository.deleteEvent(id);
  }
}
