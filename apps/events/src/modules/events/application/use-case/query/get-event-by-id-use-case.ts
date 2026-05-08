import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EventsRepository } from '../../../infrastructure/events.repository';
import { RedisService } from '../../../../../redis/redis.service';
import { EventEntity } from '../../../domain/event.entity';
import { CustomHttpException, DomainExceptionCode } from '../../../../../core/exceptions/domain.exceptions';

export class GetEventByIdQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetEventByIdQuery)
export class GetEventByIdUseCase implements IQueryHandler<GetEventByIdQuery> {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private redisService: RedisService,
  ) {}

  async execute(command: GetEventByIdQuery): Promise<EventEntity | null> {
    const { id } = command;
    const findEventInRedis: EventEntity | null = await this.redisService.getJson<EventEntity>(id);
    if (!findEventInRedis) {
      const findEventInDb: EventEntity | null = await this.eventsRepository.getEventById(id);
      if (!findEventInDb) throw new CustomHttpException(DomainExceptionCode.NOT_FOUND, 'Ивент не найден');
      await this.redisService.set(id, JSON.stringify(findEventInDb), 600);

      return findEventInDb;
    }
    return findEventInRedis;
  }
}
