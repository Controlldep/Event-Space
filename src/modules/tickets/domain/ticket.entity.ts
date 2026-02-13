import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../users/domain/user.entity';
import { EventEntity } from '../../events/domain/event.entity';

@Entity('tickets')
export class TicketEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  eventId: string;

  @ManyToOne(() => UserEntity, (user) => user.tickets)
  user: UserEntity;

  @ManyToOne(() => EventEntity, (event) => event.tickets)
  @JoinColumn({ name: 'eventId' })
  event: EventEntity;
}
