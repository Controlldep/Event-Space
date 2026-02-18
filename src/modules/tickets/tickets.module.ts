import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketEntity } from './domain/ticket.entity';
import { TicketsController } from './api/tickets.controller';
import { TicketsService } from './application/tickets.service';
import { TicketsRepository } from './repositories/tickets.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TicketEntity])],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsRepository],
  exports: [TicketsService],
})
export class TicketsModule {}
