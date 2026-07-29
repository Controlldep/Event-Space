import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { EventEntity } from '../../events/domain/event.entity';
import { CreateTicketDto } from './input-dto/create-ticket.dto';

export enum TicketStatus {
  RESERVED = 'reserved',
  PURCHASED = 'purchased',
}

@Entity('tickets')
export class TicketEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  userId: string;

  @Index()
  @Column('uuid')
  eventId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index()
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
    ticket.status = TicketStatus.RESERVED;
    ticket.reservedAt = new Date();
    ticket.eventId = dto.eventId;

    return ticket;
  }
}
