import { registerAs } from '@nestjs/config';
import { EventEntity } from '../../modules/events/domain/event.entity';
import { UserEntity } from '../../modules/users/domain/user.entity';
import { TicketEntity } from '../../modules/tickets/domain/ticket.entity';

export default registerAs('database', () => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(String(process.env.DB_PORT), 10) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [EventEntity, UserEntity, TicketEntity],
  autoLoadEntities: true,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
}));
