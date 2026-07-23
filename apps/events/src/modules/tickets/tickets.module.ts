import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketEntity } from './domain/ticket.entity';
import { TicketsController } from './api/tickets.controller';
import { TicketsService } from './application/tickets.service';
import { TicketsRepository } from './repositories/tickets.repository';
import { CqrsModule } from '@nestjs/cqrs';
import { PurchaseTicketUseCase } from './application/use-case/command/purchase-ticket-use-case';
import { DeleteTicketUseCase } from './application/use-case/command/delete-ticket-use-case';
import { GetMyTicketsUseCase } from './application/query/get-my-tickets-use-case';
import { USER_VERIFIER } from '@app/guards/user-verifier.token';
import { HttpUserVerifier } from './application/http-user-verifier.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { StripeWebhookController } from './api/stripe-webhook.internal.controller';
import { CleanReservedTicketsCron } from './application/jobs/clean-reserved-tickets.cron';

@Module({
  imports: [
    CqrsModule,
    HttpModule,
    TypeOrmModule.forFeature([TicketEntity]),
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
  controllers: [TicketsController, StripeWebhookController],
  providers: [
    { provide: USER_VERIFIER, useClass: HttpUserVerifier },
    TicketsService,
    TicketsRepository,
    PurchaseTicketUseCase,
    DeleteTicketUseCase,
    GetMyTicketsUseCase,
    CleanReservedTicketsCron,
  ],
  exports: [TicketsService],
})
export class TicketsModule {}
