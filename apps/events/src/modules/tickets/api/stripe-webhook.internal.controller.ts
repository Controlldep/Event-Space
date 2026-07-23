import { Controller, HttpCode, HttpStatus, Inject, Headers, Post, RawBody } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { TicketsRepository } from '../repositories/tickets.repository';
import { CustomHttpException, DomainExceptionCode } from '@app/exceptions';
import { LoggerService } from '@app/logger';

@Controller('internal/stripe')
export class StripeWebhookController {
  constructor(
    @Inject('PAYMENTS_SERVICE') private readonly paymentClient: ClientProxy,
    private readonly logger: LoggerService,
    private readonly ticketRepository: TicketsRepository,
  ) {
    this.logger.setContext(StripeWebhookController.name);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@RawBody() rawBody: Buffer, @Headers('stripe-signature') signature: string) {
    this.logger.log('Stripe webhook received, forwarding to payments-service');

    try {
      const result = await firstValueFrom(
        this.paymentClient.send('stripe_webhook', {
          rawBodyBase64: rawBody.toString('base64'),
          signature,
        }),
      );

      if (result.success && result.userId && result.eventId) {
        await this.ticketRepository.updateStatus(result.userId, result.eventId);
        this.logger.log(`Ticket ${result.eventId} updated to PURCHASED`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      throw new CustomHttpException(DomainExceptionCode.INTERNAL_SERVER_ERROR, 'Сервис платежей не работает');
    }
  }
}
