import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from './type/user-role.type';
import { EventEntity } from '../../events/domain/event.entity';
import { TicketEntity } from '../../tickets/domain/ticket.entity';
import { UserInputDto } from '../api/input-dto/user.input.dto';

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

  @OneToMany(() => EventEntity, (event) => event.user)
  events: EventEntity[];

  @OneToMany(() => TicketEntity, (ticket) => ticket.user)
  tickets: TicketEntity[];

  static createInstance(dto: UserInputDto): UserEntity {
    const user: UserEntity = new this();
    user.email = dto.email;
    user.passwordHash = dto.password;
    user.fullName = dto.fullName;
    user.role = dto.role;

    return user;
  }
}
