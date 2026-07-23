import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from '../domain/stripe-customer.entity';
import { LessThan, Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../domain/payment.entity';
import { CreatePaymentDto } from '../domain/dto/create-payment.dto';

@Injectable()
export class PaymentsRepository {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async findByUserId(userId: string): Promise<Payment[]> {
    return await this.paymentRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findStripeCustomerIdByUserId(userId: string): Promise<Customer | null> {
    return await this.customerRepo.findOne({
      where: { userId },
      select: ['stripeCustomerId'],
    });
  }

  async create(userId: string, stripeCustomerId: string): Promise<Customer> {
    const customer: Customer = this.customerRepo.create({
      userId,
      stripeCustomerId,
    });
    return await this.customerRepo.save(customer);
  }

  async createPayment(data: CreatePaymentDto): Promise<Payment> {
    const payment: Payment = this.paymentRepo.create(data);
    return await this.paymentRepo.save(payment);
  }

  async updateStatus(paymentId: string, status: PaymentStatus): Promise<void> {
    await this.paymentRepo.update(paymentId, { status });
  }

  async findPayment(data: { userId: string; eventId: string; status: PaymentStatus }): Promise<Payment | null> {
    return await this.paymentRepo.findOne({ where: data });
  }

  async findPendingPayments(time: Date): Promise<Payment[]> {
    return await this.paymentRepo.find({
      where: {
        status: PaymentStatus.PENDING,
        createdAt: LessThan(time),
      },
    });
  }

  async updatePendingPayments(id: string): Promise<void> {
    await this.paymentRepo.update(id, {
      status: PaymentStatus.FAILED,
    });
  }
}
