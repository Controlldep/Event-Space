import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '../../../infrastructure/payments.repository';
import { StripeService } from '../../stripe.service';
import { LoggerService } from '@app/logger';
import { CustomHttpException, DomainExceptionCode } from '@app/exceptions';
import { PaymentStatus } from '../../../domain/payment.entity';

export class RefundPaymentCommand {
  constructor(
    public readonly eventId: string,
    public readonly userId: string,
  ) {}
}

@CommandHandler(RefundPaymentCommand)
export class RefundPaymentUseCase implements ICommandHandler<RefundPaymentCommand> {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly stripeService: StripeService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(RefundPaymentUseCase.name);
  }

  async execute(command: RefundPaymentCommand): Promise<{ success: boolean }> {
    const { eventId, userId } = command;

    const payment = await this.paymentsRepository.findPayment({
      userId,
      eventId,
      status: PaymentStatus.SUCCEEDED,
    });

    if (!payment) {
      throw new CustomHttpException(DomainExceptionCode.NOT_FOUND, 'Payment not found');
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'Payment cannot be refunded');
    }

    try {
      await this.stripeService.refundPayment(payment.stripePaymentIntentId);

      await this.paymentsRepository.updateStatus(payment.id, PaymentStatus.REFUNDED);

      this.logger.log(`Payment ${payment.id} refunded for ticket ${eventId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Refund failed for payment ${payment.id}: ${error.message}`);
      throw new CustomHttpException(DomainExceptionCode.INTERNAL_SERVER_ERROR, 'Refund failed');
    }
  }
}
