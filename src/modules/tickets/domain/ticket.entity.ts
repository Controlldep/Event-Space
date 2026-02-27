import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../users/domain/user.entity';
import { CreateTicketDto } from './input-dto/create-ticket.dto';
import { EventEntity } from '../../events/domain/event.entity';

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

  @ManyToOne(() => UserEntity, (user) => user.tickets)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => EventEntity, (event) => event.tickets)
  @JoinColumn({ name: 'eventId' })
  event: EventEntity;

  static createInstance(dto: CreateTicketDto): TicketEntity {
    const ticket: TicketEntity = new this();
    ticket.userId = dto.userId;
    ticket.eventId = dto.eventId;

    return ticket;
  }
}
