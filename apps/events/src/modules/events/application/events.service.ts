import { Injectable } from '@nestjs/common';
import { EventsRepository } from '../infrastructure/events.repository';
import { DeleteResult } from 'typeorm';

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async deleteEvent(id: string): Promise<DeleteResult> {
    return await this.eventsRepository.deleteEvent(id);
  }
}
