import { Module } from '@nestjs/common';
import { RabbitConsumer } from './rabbit-consumer';
import { EmailService } from './email.service';
import { ConsumerService } from './consumer.service';

@Module({
  imports: [],
  controllers: [RabbitConsumer],
  providers: [EmailService, ConsumerService],
  exports: [],
})
export class EmailModule {}
