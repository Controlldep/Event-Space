import { UserRepository } from '../../../../infrastructure/user.repository';
import { DeleteResult } from 'typeorm';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TicketsRepository } from '../../../../../tickets/repositories/tickets.repository';
import { EventsRepository } from '../../../../../events/infrastructure/events.repository';

export class DeleteUserCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase implements ICommandHandler<DeleteUserCommand> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: DeleteUserCommand): Promise<DeleteResult> {
    const { id } = command;
    return await this.userRepository.deleteUser(id);
  }
}
