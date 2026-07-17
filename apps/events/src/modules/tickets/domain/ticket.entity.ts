import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { EventEntity } from '../../events/domain/event.entity';
import { CreateTicketDto } from './input-dto/create-ticket.dto';

export enum TicketStatus {
  RESERVED = 'reserved',
  PURCHASED = 'purchased',
  CANCELLED = 'cancelled',
}

@Entity('tickets')
export class TicketEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  eventId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.RESERVED })
  status: TicketStatus;

  @Column({ type: 'timestamp', nullable: true })
  reservedAt: Date;

  @ManyToOne('EventEntity', (event: EventEntity) => event.tickets)
  @JoinColumn({ name: 'eventId' })
  event: EventEntity;

  static createInstance(dto: CreateTicketDto): TicketEntity {
    const ticket: TicketEntity = new this();
    ticket.userId = dto.userId;
    ticket.reservedAt = new Date();
    ticket.eventId = dto.eventId;

    return ticket;
  }
}
