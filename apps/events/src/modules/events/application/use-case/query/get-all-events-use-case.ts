import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QueryEventDto } from '../../../api/input-dto/query-event.dto';
import { EventsRepository } from '../../../infrastructure/events.repository';

export class GetAllEventsQuery {
  constructor(public readonly dto: QueryEventDto) {}
}

@QueryHandler(GetAllEventsQuery)
export class GetAllEventsUseCase implements IQueryHandler<GetAllEventsQuery> {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async execute(command: GetAllEventsQuery) {
    const { dto } = command;
    const [items, total] = await this.eventsRepository.getAllEvents(dto);

    return {
      items,
      total,
      pageNumber: dto.pageNumber,
      pageSize: dto.pageSize,
      totalPages: Math.ceil(total / dto.pageSize),
    };
  }
}
