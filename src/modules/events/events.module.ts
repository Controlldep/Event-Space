import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from './domain/event.entity';
import { EventsController } from './api/events.controller';
import { EventsService } from './application/events.service';
import { EventsRepository } from './infrastructure/events.repository';

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity])],
  controllers: [EventsController],
  providers: [EventsService, EventsRepository],
  exports: [],
})
export class EventsModule {}
