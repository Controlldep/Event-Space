import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { CustomHttpException, DomainExceptionCode } from './core/exceptions/domain.exceptions';
import cookieParser from 'cookie-parser';
import { CustomExceptionFilter } from './core/exceptions/exceptionts-filter';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { LoggerService } from '@app/logger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy', true);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: false,
      exceptionFactory: (errors) => {
        const details = errors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
        }));
        throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'Validation failed', details);
      },
    }),
  );

  app.use(cookieParser());
  app.useGlobalFilters(new CustomExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Event Space API')
    .setDescription('The event-space API description')
    .addBearerAuth()
    .setVersion('1.0')
    .build();
  const options: SwaggerDocumentOptions = {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  };

  const logger = app.get(LoggerService);
  app.useLogger(logger);

  const documentFactory = () => SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
