import { Injectable, Logger } from '@nestjs/common';
import { NewDeviceLoginPayload, TicketPurchasedPayload, UserRegisteredPayload } from '@app/common';

@Injectable()
export class EmailService {
  private readonly logger: Logger = new Logger(EmailService.name);

  sendWelcome(payload: UserRegisteredPayload): void {
    return this.logger.log('Sending welcome email', { email: payload.email });
  }

  sendTicket(payload: TicketPurchasedPayload): void {
    return this.logger.log(`Purchasing a ticket to an event ${payload.eventName}`, {
      startTime: payload.startTime,
      endTime: payload.endTime,
    });
  }

  sendLogin(payload: NewDeviceLoginPayload): void {
    return this.logger.log('New device login detected', {
      ip: payload.ip,
      device: payload.userAgent,
    });
  }
}
