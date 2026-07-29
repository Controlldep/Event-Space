import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Customer } from './stripe-customer.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'stripe_payment_intent_id', type: 'varchar' })
  stripePaymentIntentId: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Index()
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ name: 'webhook_received_at', type: 'timestamp', nullable: true })
  webhookReceivedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  stripeResponse: JSON;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Index()
  @Column({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.payments)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;
}
