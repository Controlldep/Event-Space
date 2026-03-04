import { EventsRepository } from 'src/modules/events/infrastructure/events.repository';
import { EventEntity } from 'src/modules/events/domain/event.entity';
import { RedisService } from 'src/redis/redis.service';
import { CustomHttpException, DomainExceptionCode } from 'src/core/exceptions/domain.exceptions';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

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
