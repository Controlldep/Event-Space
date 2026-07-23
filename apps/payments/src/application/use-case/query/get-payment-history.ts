import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '../../../infrastructure/payments.repository';
import { Payment } from '../../../domain/payment.entity';

export class GetPaymentHistoryQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetPaymentHistoryQuery)
export class GetPaymentHistoryHandler implements IQueryHandler<GetPaymentHistoryQuery> {
  constructor(private readonly paymentsRepository: PaymentsRepository) {}

  async execute(query: GetPaymentHistoryQuery): Promise<Payment[]> {
    return this.paymentsRepository.findByUserId(query.userId);
  }
}
