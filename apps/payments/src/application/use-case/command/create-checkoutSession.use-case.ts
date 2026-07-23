import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateStripeCheckoutInputDto } from '../../../api/input-dto/create-stripe-checkout.input.dto';
import { StripeService } from '../../stripe.service';
import { PaymentsRepository } from '../../../infrastructure/payments.repository';
import { Customer } from '../../../domain/stripe-customer.entity';
import { LoggerService } from '@app/logger';

export class CreateCheckoutSessionCommand {
  constructor(public readonly dto: CreateStripeCheckoutInputDto) {}
}

@CommandHandler(CreateCheckoutSessionCommand)
export class CreateCheckoutSessionUseCase implements ICommandHandler<CreateCheckoutSessionCommand> {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly stripeService: StripeService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(CreateCheckoutSessionUseCase.name);
  }

  async execute(command: CreateCheckoutSessionCommand) {
    const { dto } = command;

    const customerId: string = await this.getOrCreateStripeCustomer(dto.userId);

    const session = await this.stripeService.createCheckoutSession(customerId, dto);

    this.logger.log(`Checkout session created: ${session.id}`);
    return { checkoutUrl: session.url };
  }

  private async getOrCreateStripeCustomer(userId: string): Promise<string> {
    const existing: Customer | null = await this.paymentsRepository.findStripeCustomerIdByUserId(userId);
    if (existing) {
      this.logger.log(`Found existing Stripe customer: ${existing.stripeCustomerId}`);
      return existing.stripeCustomerId;
    }

    const customer = await this.stripeService.createCustomer(userId);
    await this.paymentsRepository.create(userId, customer.id);

    this.logger.log(`Created new Stripe customer: ${customer.id}`);
    return customer.id;
  }
}
