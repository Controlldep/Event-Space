import { PaymentStatus } from '../payment.entity';

export class CreatePaymentDto {
  userId: string;
  eventId: string;
  customerId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  webhookReceivedAt: Date;
  paidAt: Date | null;
  stripeResponse: JSON;
}
