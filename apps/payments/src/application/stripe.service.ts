import Stripe, { Event } from 'stripe';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../core/config/env.validation';
import { CreateStripeCheckoutInputDto } from '../api/input-dto/create-stripe-checkout.input.dto';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService<EnvConfig>) {
    this.stripe = new Stripe(this.configService.getOrThrow('STRIPE_SECRET_KEY'), { apiVersion: '2026-06-24.dahlia' });
  }

  async createCustomer(data: string) {
    return this.stripe.customers.create({
      metadata: {
        data,
      },
    });
  }

  async createCheckoutSession(customerId: string, dto: CreateStripeCheckoutInputDto) {
    return this.stripe.checkout.sessions.create({
      customer: customerId,
      success_url: 'https://google.com',
      cancel_url: 'https://google.com',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Билет на ивент: ${dto.eventTitle}`,
            },
            unit_amount: dto.price * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId: dto.eventId,
        userId: dto.userId,
      },
      mode: 'payment',
    });
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Event {
    return this.stripe.webhooks.constructEvent(rawBody, signature, this.configService.getOrThrow('STRIPE_WEBHOOK_SECRET'));
  }

  async refundPayment(paymentIntentId: string): Promise<void> {
    await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
  }
}
