import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from './enum/user-role.type';
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

  @Index()
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

  @OneToMany('SessionEntity', (session: SessionEntity) => session.user)
  sessions: SessionEntity[];

  static createInstance(dto: CreateUserDomainModel): UserEntity {
    const user: UserEntity = new this();
    user.email = dto.email.toLowerCase();
    user.passwordHash = dto.passwordHash;
    user.fullName = dto.fullName;
    user.role = dto.role;

    return user;
  }
}
