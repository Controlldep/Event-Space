import { Controller, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { LoggerService } from '@app/logger';
import { PaymentsJwtGuard } from '../guard/payments-jwt.guard';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CreateStripeCheckoutInputDto } from './input-dto/create-stripe-checkout.input.dto';
import { CreateCheckoutSessionCommand } from '../application/use-case/command/create-checkoutSession.use-case';
import { StripeWebhookCommand } from '../application/use-case/command/stripe-webhook.use-case';
import { GetPaymentHistoryQuery } from '../application/use-case/query/get-payment-history';
import { RefundPaymentCommand } from '../application/use-case/command/refund-payment.use-case';

@UseGuards(PaymentsJwtGuard)
@Controller('payments')
export class PaymentsTcpController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(PaymentsTcpController.name);
  }

  @MessagePattern('payments.create-checkout-session')
  async createCheckoutSession(@Payload() data: CreateStripeCheckoutInputDto) {
    return this.commandBus.execute(new CreateCheckoutSessionCommand(data));
  }

  @EventPattern('stripe_webhook')
  async handleStripeWebhook(@Payload() data: { rawBodyBase64: string; signature: string }) {
    this.logger.log('Stripe webhook event received via TCP handleStripeWebhook');
    const rawBody = Buffer.from(data.rawBodyBase64, 'base64');
    return await this.commandBus.execute(new StripeWebhookCommand(rawBody, data.signature));
  }

  @MessagePattern('payments.get-history')
  async getPaymentHistory(@Payload() data: { userId: string }) {
    return this.queryBus.execute(new GetPaymentHistoryQuery(data.userId));
  }

  @MessagePattern('payments.refund')
  async refund(@Payload() data: { eventId: string; userId: string }) {
    return this.commandBus.execute(new RefundPaymentCommand(data.eventId, data.userId));
  }
}
