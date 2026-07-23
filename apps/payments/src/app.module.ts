import { join } from 'path';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule, RequestContextMiddleware } from '@app/logger';
import databaseConfig from './core/config/database.config';
import { envSchema } from './core/config/env.validation';
import { PaymentsJwtStrategy } from './guard/payments.strategy';
import { PassportModule } from '@nestjs/passport';
import { PaymentsJwtGuard } from './guard/payments-jwt.guard';
import { PaymentsTcpController } from './api/payments.tcp.controller';
import { CreateCheckoutSessionUseCase } from './application/use-case/command/create-checkoutSession.use-case';
import { StripeWebhookUseCase } from './application/use-case/command/stripe-webhook.use-case';
import { GetPaymentHistoryHandler } from './application/use-case/query/get-payment-history';
import { RefundPaymentUseCase } from './application/use-case/command/refund-payment.use-case';
import { StripeService } from './application/stripe.service';

@Module({
  imports: [
    LoggerModule,
    PassportModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: join(process.cwd(), 'env', `.env.${process.env.NODE_ENV || 'development'}`),
      validate: (config) => {
        const parsed = envSchema.safeParse(config);
        if (!parsed.success) {
          console.error('Ошибка в файле .env:', parsed.error.format());
          throw new Error('Config validation failed');
        }
        return parsed.data;
      },
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get<TypeOrmModuleOptions>('database')!,
    }),
  ],
  controllers: [PaymentsTcpController],
  providers: [
    PaymentsJwtStrategy,
    PaymentsJwtGuard,
    CreateCheckoutSessionUseCase,
    StripeWebhookUseCase,
    GetPaymentHistoryHandler,
    RefundPaymentUseCase,
    StripeService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
