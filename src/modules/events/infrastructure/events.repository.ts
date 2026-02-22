import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { EventEntity } from '../domain/event.entity';

@Injectable()
export class EventsRepository {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity>,
  ) {}

  async getAllEvents(): Promise<EventEntity[]> {
    return await this.eventsRepository.find();
  }

  async getEventById(id: string): Promise<EventEntity | null> {
    return await this.eventsRepository.findOneBy({ id });
  }

  async deleteEvent(id: string): Promise<DeleteResult> {
    return await this.eventsRepository.delete(id);
  }
}
