import { join } from 'path';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule, RequestContextMiddleware } from '@app/logger';
import databaseConfig from './core/config/database.config';
import { envSchema } from './core/config/env.validation';

@Module({
  imports: [
    LoggerModule,
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
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
