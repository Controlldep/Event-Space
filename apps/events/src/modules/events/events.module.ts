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
import { GetAllEventsUseCase } from './application/use-case/query/get-all-events-use-case';
import { GetEventByIdUseCase } from './application/use-case/query/get-event-by-id-use-case';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([EventEntity]),
    TicketsModule,
    ClientsModule.registerAsync([
      {
        name: 'PAYMENTS_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: 'localhost',
            port: configService.get('PAYMENTS_TCP_PORT'),
          },
        }),
      },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService, EventsRepository, CreateEventUseCase, UpdateEventUseCase, GetAllEventsUseCase, GetEventByIdUseCase],
  exports: [],
})
export class EventsModule {}
