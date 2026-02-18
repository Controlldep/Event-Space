import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { EventEntity } from '../domain/event.entity';
import { CreateEventDto } from '../api/input-dto/create-event.dto';
import { CustomHttpException, DomainExceptionCode } from '../../../core/exceptions/domain.exceptions';

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

  async createEvent(id: string, dto: CreateEventDto): Promise<EventEntity> {
    const event: EventEntity = this.eventsRepository.create(dto);
    const saveEvent: EventEntity = await this.eventsRepository.save(event);
    return saveEvent;
  }

  async patchEvent(id: string, dto: CreateEventDto): Promise<EventEntity> {
    const event: EventEntity | null = await this.eventsRepository.findOneBy({ id });
    if (!event) throw new CustomHttpException(DomainExceptionCode.NOT_FOUND);

    Object.assign(event, dto);

    return await this.eventsRepository.save(event);
  }

  async deleteEvent(id: string): Promise<DeleteResult> {
    return await this.eventsRepository.delete(id);
  }
}
