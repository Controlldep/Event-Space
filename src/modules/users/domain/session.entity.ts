import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { UserEntity } from './user.entity';
import { SessionInputDto } from './input-dto/session.input.dto';

@Entity('session')
@Unique(['userId', 'deviceId'])
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  deviceId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  jtiHash: string;

  @Column({ type: 'timestamp' })
  expirationDate: Date;

  @Column({ type: 'varchar' })
  ip: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'timestamp' })
  lastActiveDate: string;

  @ManyToOne(() => UserEntity, (user) => user.sessions)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  static createInstance(dto: SessionInputDto): SessionEntity {
    const session: SessionEntity = new this();
    session.deviceId = dto.deviceId;
    session.userId = dto.userId;
    session.ip = dto.ip;
    session.jtiHash = dto.jtiHash;
    session.title = dto.title;
    session.lastActiveDate = dto.lastActiveDate;
    session.expirationDate = dto.expirationDate;

    return session;
  }
}
