import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../users/domain/user.entity';
import { TicketEntity } from '../../tickets/domain/ticket.entity';

@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  maxParticipants: number;

  @Column()
  date: string;

  @Column()
  location: string;

  @Column('uuid')
  organizerId: string;

  @ManyToOne(() => UserEntity, (user) => user.events)
  @JoinColumn({ name: 'organizerId' })
  user: UserEntity;

  @OneToMany(() => TicketEntity, (ticket) => ticket.event)
  tickets: TicketEntity[];
}
