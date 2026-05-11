import { ConsumerService } from '@apps/src/consumer.service';
import { OutboxEventType } from '@app/common';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class RabbitConsumer {
  constructor(private readonly consumerService: ConsumerService) {}

  @MessagePattern('outbox.events')
  handleIncomingMessage(data: { type: OutboxEventType; payload: any }) {
    this.consumerService.dispatch(data.type, data.payload);
  }
}
