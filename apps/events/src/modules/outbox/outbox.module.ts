import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEntity } from 'src/modules/outbox/outbox.entity';
import { OutboxService } from 'src/modules/outbox/outbox.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEntity])],
  controllers: [],
  providers: [OutboxService],
  exports: [],
})
export class OutboxModule {}
