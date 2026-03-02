import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from './enum/user-role.type';
import type { EventEntity } from '../../events/domain/event.entity';
import type { TicketEntity } from '../../tickets/domain/ticket.entity';
import type { SessionEntity } from './session.entity';
import { CreateUserDomainModel } from './input-dto/user-domain.model';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('EventEntity', (event: EventEntity) => event.user)
  events: EventEntity[];

  @OneToMany('SessionEntity', (session: SessionEntity) => session.user)
  sessions: SessionEntity[];

  @OneToMany('TicketEntity', (ticket: TicketEntity) => ticket.user)
  tickets: TicketEntity[];

  static createInstance(dto: CreateUserDomainModel): UserEntity {
    const user: UserEntity = new this();
    user.email = dto.email.toLowerCase();
    user.passwordHash = dto.passwordHash;
    user.fullName = dto.fullName;
    user.role = dto.role;

    return user;
  }
}
