import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { StripeService } from '../../stripe.service';
import { PaymentsRepository } from '../../../infrastructure/payments.repository';
import { PaymentStatus } from '../../../domain/payment.entity';
import { Event } from 'stripe';
import { LoggerService } from '@app/logger';

export class StripeWebhookCommand {
  constructor(
    public readonly rawBody: Buffer,
    public readonly signature: string,
  ) {}
}

@CommandHandler(StripeWebhookCommand)
export class StripeWebhookUseCase implements ICommandHandler<StripeWebhookCommand> {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly stripeService: StripeService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(StripeWebhookUseCase.name);
  }

  async execute({
    rawBody,
    signature,
  }: StripeWebhookCommand): Promise<{ success: boolean; userId: string | null; eventId: string | null }> {
    const event: Event = this.stripeService.constructWebhookEvent(rawBody, signature);
    this.logger.log(`Webhook received: ${event.type}, id=${event.id}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        return { success: true, userId: event.data.object.metadata!.userId, eventId: event.data.object.metadata!.eventId };

      case 'payment_intent.payment_failed':
        await this.paymentsRepository.createPayment({
          userId: event.data.object.metadata.userId,
          stripePaymentIntentId: event.data.object.id,
          amount: event.data.object.amount,
          currency: event.data.object.currency.toUpperCase(),
          status: PaymentStatus.FAILED,
          webhookReceivedAt: new Date(),
          stripeResponse: JSON.parse(JSON.stringify(event.data.object)),
          paidAt: null,
          customerId: event.data.object.customer as string,
          eventId: event.data.object.metadata.eventId,
        });
        this.logger.warn(`payment_intent.payment_failed: ${event.data.object.id}`, 'execute');
        return { success: false, userId: event.data.object.metadata.userId, eventId: event.data.object.metadata.eventId };

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
        return { success: false, userId: null, eventId: null };
    }
  }

  private async handleCheckoutCompleted(session: any): Promise<void> {
    const { userId, eventId } = session.metadata;

    const paymentIntentId = session.payment_intent;
    const customerId = session.customer;
    this.logger.log(`checkout.session.completed: userId=${userId}, paymentIntentId=${paymentIntentId}`);

    await this.paymentsRepository.createPayment({
      userId,
      stripePaymentIntentId: paymentIntentId,
      amount: session.amount_total / 100,
      currency: session.currency.toUpperCase(),
      status: PaymentStatus.SUCCEEDED,
      webhookReceivedAt: new Date(),
      stripeResponse: session,
      paidAt: new Date(),
      customerId,
      eventId,
    });
  }
}
