import { Cron } from '@nestjs/schedule';
import { Injectable } from '@nestjs/common';
import { PaymentsRepository } from '../../infrastructure/payments.repository';
import { Payment } from '../../domain/payment.entity';

@Injectable()
export class CleanPendingPaymentsCron {
  constructor(private readonly paymentsRepository: PaymentsRepository) {}

  @Cron('*/5 * * * *')
  async handle() {
    const fifteenMinutesAgo: Date = new Date(Date.now() - 15 * 60 * 1000);

    const expiredPayments: Payment[] = await this.paymentsRepository.findPendingPayments(fifteenMinutesAgo);

    for (const payment of expiredPayments) {
      await this.paymentsRepository.updatePendingPayments(payment.id);
      console.log(`Payment ${payment.id} marked as FAILED due to timeout`);
    }
  }
}
