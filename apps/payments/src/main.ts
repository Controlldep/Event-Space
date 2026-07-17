import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { CustomExceptionFilter, CustomHttpException, DomainExceptionCode } from '@app/exceptions';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });
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

  await app.listen(process.env.PORT ?? 3002);
}

bootstrap();
