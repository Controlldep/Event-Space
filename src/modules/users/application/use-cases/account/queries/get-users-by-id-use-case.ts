import { UserEntity } from '../../../../domain/user.entity';
import { CustomHttpException, DomainExceptionCode } from '../../../../../../core/exceptions/domain.exceptions';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../../infrastructure/users-query.repository';
import { RedisService } from 'src/redis/redis.service';

export class GetUsersByIdQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetUsersByIdQuery)
export class GetUsersByIdUseCase implements IQueryHandler<GetUsersByIdQuery> {
  constructor(
    private readonly usersQueryRepository: UsersQueryRepository,
    private redisService: RedisService,
  ) {}

  async execute(command: GetUsersByIdQuery): Promise<UserEntity | null> {
    const { id } = command;
    const findInRedis: UserEntity | null = await this.redisService.getJson<UserEntity>(id);
    if (!findInRedis) {
      const result: UserEntity | null = await this.usersQueryRepository.getUsersById(id);
      if (!result) throw new CustomHttpException(DomainExceptionCode.NOT_FOUND);
      await this.redisService.set(id, JSON.stringify(result), 600);
      return result;
    }
    return findInRedis;
  }
}
