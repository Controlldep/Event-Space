import { UserRepository } from '../../../../infrastructure/user.repository';
import { DeleteResult } from 'typeorm';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

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
