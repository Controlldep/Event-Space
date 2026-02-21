import { UserEntity } from '../../../../domain/user.entity';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../../infrastructure/users-query.repository';

export class GetAllUsersQuery {}

@QueryHandler(GetAllUsersQuery)
export class GetAllUsersUseCase implements IQueryHandler<GetAllUsersQuery> {
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  async execute(): Promise<UserEntity[]> {
    return await this.usersQueryRepository.getAllUsers();
  }
}
