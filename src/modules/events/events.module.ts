import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from './domain/event.entity';
import { EventsController } from './api/events.controller';
import { EventsService } from './application/events.service';
import { EventsRepository } from './infrastructure/events.repository';
import { TicketsModule } from '../tickets/tickets.module';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateEventUseCase } from './application/use-case/command/create-event-use-case';
import { UpdateEventUseCase } from './application/use-case/command/update-event-use-case';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([EventEntity]), TicketsModule],
  controllers: [EventsController],
  providers: [EventsService, EventsRepository, CreateEventUseCase, UpdateEventUseCase],
  exports: [],
})
export class EventsModule {}
