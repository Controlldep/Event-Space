import { Injectable } from '@nestjs/common';
import { EventsRepository } from '../infrastructure/events.repository';
import { QueryEventDto } from '../api/input-dto/query-event.dto';
import { EventEntity } from '../domain/event.entity';
import { DeleteResult } from 'typeorm';

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async getAllEvents(dto: QueryEventDto) {
    const [items, total] = await this.eventsRepository.getAllEvents(dto);

    return {
      items,
      total,
      pageNumber: dto.pageNumber,
      pageSize: dto.pageSize,
      totalPages: Math.ceil(total / dto.pageSize),
    };
  }

  async getEventById(id: string): Promise<EventEntity | null> {
    return await this.eventsRepository.getEventById(id);
  }

  async deleteEvent(id: string): Promise<DeleteResult> {
    return await this.eventsRepository.deleteEvent(id);
  }
}
