import { Injectable, Logger } from '@nestjs/common';
import { NewDeviceLoginPayload, OutboxEventType, TicketPurchasedPayload, UserRegisteredPayload } from '@app/common';
import { EmailService } from './email.service';

interface EventMap {
  [OutboxEventType.USER_REGISTERED]: UserRegisteredPayload;
  [OutboxEventType.TICKET_PURCHASED]: TicketPurchasedPayload;
  [OutboxEventType.NEW_DEVICE_LOGIN]: NewDeviceLoginPayload;
}

@Injectable()
export class ConsumerService {
  private readonly logger: Logger = new Logger(ConsumerService.name);
  private readonly handlers: { [K in OutboxEventType]: (payload: EventMap[K]) => void } = {
    [OutboxEventType.USER_REGISTERED]: (p) => this.emailService.sendWelcome(p),
    [OutboxEventType.TICKET_PURCHASED]: (p) => this.emailService.sendTicket(p),
    [OutboxEventType.NEW_DEVICE_LOGIN]: (p) => this.emailService.sendLogin(p),
  };
  Я;

  constructor(private readonly emailService: EmailService) {}

  dispatch<T extends OutboxEventType>(type: T, payload: EventMap[T]): void {
    const handler = this.handlers[type];

    if (!handler) {
      this.logger.warn(`Нет обработчика для ${type}`);
    }

    handler(payload);
  }
}
