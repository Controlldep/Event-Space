import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { EventEntity } from '../domain/event.entity';
import { QueryEventDto } from '../api/input-dto/query-event.dto';

@Injectable()
export class EventsRepository {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity>,
  ) {}

  async getAllEvents(filters: QueryEventDto): Promise<[EventEntity[], number]> {
    const { search, category, dateFrom, pageSize, sortDirection } = filters;

    const queryBuilder = this.eventsRepository.createQueryBuilder('event');

    if (search) {
      queryBuilder.andWhere('(event.title ILIKE :search OR event.description ILIKE :search)', { search: `%${search}%` });
    }

    if (category) {
      queryBuilder.andWhere('event.category = :category', { category });
    }

    if (dateFrom) {
      queryBuilder.andWhere('event.startTime >= :dateFrom', { dateFrom });
    }

    queryBuilder
      .orderBy('event.startTime', sortDirection.toUpperCase() as 'ASC' | 'DESC')
      .skip((filters.pageNumber - 1) * pageSize)
      .take(pageSize);

    return queryBuilder.getManyAndCount();
  }

  async getEventById(id: string): Promise<EventEntity | null> {
    return await this.eventsRepository.findOneBy({ id });
  }

  async deleteEvent(id: string): Promise<DeleteResult> {
    return await this.eventsRepository.delete(id);
  }
}
