import { Inject, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class TicketsService {
  constructor(@Inject('PAYMENTS_SERVICE') private readonly paymentsClient: ClientProxy) {}

  async getPaymentHistory(userId: string) {
    return firstValueFrom(this.paymentsClient.send('payments.get-history', { userId }));
  }
}
