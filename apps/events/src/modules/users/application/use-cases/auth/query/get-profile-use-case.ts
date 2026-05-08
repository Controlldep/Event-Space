import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../../../../infrastructure/user.repository';
import { UserEntity } from '../../../../domain/user.entity';
import { ActiveUserData } from '../../../../../../core/decorators/extract-user-from-request';

export class GetProfileQuery {
  constructor(public readonly user: ActiveUserData) {}
}

@CommandHandler(GetProfileQuery)
export class GetProfileUseCase implements ICommandHandler<GetProfileQuery> {
  constructor(private readonly usersRepository: UserRepository) {}

  async execute(command: GetProfileQuery): Promise<UserEntity | null> {
    const { user } = command;
    return await this.usersRepository.getUsersById(user.userId);
  }
}
