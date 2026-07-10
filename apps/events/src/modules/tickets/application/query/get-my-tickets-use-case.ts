import { TicketEntity } from '../../domain/ticket.entity';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseQueryParams } from '../../../../core/dto/base.query.params';

export class GetMyTicketsQuery {
  constructor(
    public readonly userId: string,
    public readonly dto: BaseQueryParams,
  ) {}
}

@QueryHandler(GetMyTicketsQuery)
export class GetMyTicketsUseCase implements IQueryHandler<GetMyTicketsQuery> {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketsRepository: Repository<TicketEntity>,
  ) {}

  async execute(command: GetMyTicketsQuery): Promise<[TicketEntity[], number]> {
    const { userId, dto } = command;
    return await this.ticketsRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.event', 'event')
      .where('ticket.userId = :userId', { userId })
      .orderBy('ticket.createdAt', dto.sortDirection)
      .skip((dto.pageNumber - 1) * dto.pageSize)
      .take(dto.pageSize)
      .getManyAndCount();
  }
}
