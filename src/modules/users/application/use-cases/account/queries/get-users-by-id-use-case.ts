import { UserEntity } from '../../../../domain/user.entity';
import { CustomHttpException, DomainExceptionCode } from '../../../../../../core/exceptions/domain.exceptions';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../../infrastructure/users-query.repository';

export class GetUsersByIdQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetUsersByIdQuery)
export class GetUsersByIdUseCase implements IQueryHandler<GetUsersByIdQuery> {
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  async execute(command: GetUsersByIdQuery): Promise<UserEntity | null> {
    const { id } = command;
    const result: UserEntity | null = await this.usersQueryRepository.getUsersById(id);
    if (!result) throw new CustomHttpException(DomainExceptionCode.NOT_FOUND);
    return result;
  }
}
