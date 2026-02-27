import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketEntity } from './domain/ticket.entity';
import { TicketsController } from './api/tickets.controller';
import { TicketsService } from './application/tickets.service';
import { TicketsRepository } from './repositories/tickets.repository';
import { CreateTicketsUseCase } from './application/use-case/command/create-tickets';
import { CqrsModule } from '@nestjs/cqrs';
import { DeleteTicketUseCase } from './application/use-case/command/delete-ticket-use-case';
import { GetMyTicketsUseCase } from './application/use-case/query/get-my-tickets-use-case';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([TicketEntity])],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsRepository, CreateTicketsUseCase, DeleteTicketUseCase, GetMyTicketsUseCase],
  exports: [TicketsService],
})
export class TicketsModule {}
