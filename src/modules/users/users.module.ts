import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller';
import { UsersService } from './application/users.service';
import { UserRepository } from './infrastructure/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './domain/user.entity';
import { TicketEntity } from '../tickets/domain/ticket.entity';
import { EventEntity } from '../events/domain/event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, TicketEntity, EventEntity])],
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  exports: [],
})
export class UsersModule {}
