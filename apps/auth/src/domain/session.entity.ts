import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import type { UserEntity } from './user.entity';
import { SessionInputDto } from './input-dto/session.input.dto';

@Entity('session')
@Unique(['userId', 'deviceId'])
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  deviceId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  ip: string;

  @Column({ type: 'varchar' })
  userAgent: string;

  @Column({ type: 'timestamp' })
  lastActiveDate: Date;

  @Column({ type: 'timestamp' })
  expirationDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('UserEntity', (user: UserEntity) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  static createInstance(dto: SessionInputDto): SessionEntity {
    const session: SessionEntity = new this();
    session.deviceId = dto.deviceId;
    session.userId = dto.userId;
    session.ip = dto.ip;
    session.userAgent = dto.userAgent;
    session.lastActiveDate = dto.lastActiveDate;
    session.expirationDate = dto.expirationDate;

    return session;
  }
}
