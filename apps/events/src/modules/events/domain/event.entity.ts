import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { TicketEntity } from '../../tickets/domain/ticket.entity';
import { CreateEventDto } from '../api/input-dto/create-event.dto';
import { EventCategory } from './enum/event-category';

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

  @Column({ default: 0 })
  currentParticipantsCount: number;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;

  @Column()
  location: string;

  @Column({
    type: 'enum',
    enum: EventCategory,
  })
  category: EventCategory;

  @Column('uuid')
  organizerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('TicketEntity', (ticket: TicketEntity) => ticket.event)
  tickets: TicketEntity[];

  static createInstance(dto: CreateEventDto, organizerId: string): EventEntity {
    const event: EventEntity = new this();
    event.title = dto.title;
    event.description = dto.description;
    event.maxParticipants = dto.maxParticipants;
    event.organizerId = organizerId;
    event.startTime = dto.startTime;
    event.endTime = dto.endTime;
    event.location = dto.location;
    event.category = dto.category;
    event.currentParticipantsCount = 0;

    return event;
  }
}
