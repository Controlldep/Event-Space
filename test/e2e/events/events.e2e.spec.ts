import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { CustomHttpException, DomainExceptionCode } from '../../../src/core/exceptions/domain.exceptions';
import { CustomExceptionFilter } from '../../../src/core/exceptions/exceptionts-filter';
import { LoggingInterceptor } from '../../../src/core/interceptors/logging.interceptor';
import { cleanDatabase } from '../../helpers/db-cleaner';
import request from 'supertest';
import { EventEntity } from '../../../src/modules/events/domain/event.entity';

describe('Events (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.getHttpAdapter().getInstance().set('trust proxy', true);

    app.use(cookieParser());

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

    app.useGlobalFilters(new CustomExceptionFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());

    await app.init();

    dataSource = app.get(DataSource);
  });
  beforeEach(async () => {
    await cleanDatabase(dataSource);

    const regRes = await request(app.getHttpServer()).post('/auth/registration').set('user-agent', 'TestAgent').send({
      email: 'org@test.com',
      password: 'password123',
      fullName: 'Ivan Организатор',
      role: 'organizer',
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .set('user-agent', 'TestAgent')
      .set('x-device-id', regRes.body.deviceId)
      .send({ email: 'org@test.com', password: 'password123' });

    accessToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('должен создать ивент (успешно)', async () => {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 2);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 2);

    const createDto = {
      title: 'Rock Show',
      description: 'Super mega description more than 10 chars',
      maxParticipants: 100,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      location: 'Moscow',
      category: 'vocal',
    };

    const res = await request(app.getHttpServer()).post('/events').set('Authorization', `Bearer ${accessToken}`).send(createDto);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Rock Show');
  });

  it('должен вернуть 400 при конфликте расписания (правило буфера в 1 час)', async () => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 1);

    const startTime1 = new Date(baseDate);
    startTime1.setHours(14, 0, 0, 0);

    const endTime1 = new Date(baseDate);
    endTime1.setHours(16, 0, 0, 0);

    const firstEventDto = {
      title: 'First Concert',
      description: 'First event description more than 10 chars',
      maxParticipants: 50,
      startTime: startTime1.toISOString(),
      endTime: endTime1.toISOString(),
      location: 'Main Hall',
      category: 'vocal',
    };
    await request(app.getHttpServer()).post('/events').set('Authorization', `Bearer ${accessToken}`).send(firstEventDto).expect(201);

    const startTime2 = new Date(baseDate);
    startTime2.setHours(16, 30, 0, 0);

    const endTime2 = new Date(baseDate);
    endTime2.setHours(18, 0, 0, 0);

    const secondEventDto = {
      title: 'Conflicting Event',
      description: 'This should fail because it is too close',
      maxParticipants: 30,
      startTime: startTime2.toISOString(),
      endTime: endTime2.toISOString(),
      location: 'Small Hall',
      category: 'art',
    };

    const response = await request(app.getHttpServer()).post('/events').set('Authorization', `Bearer ${accessToken}`).send(secondEventDto);
    expect(response.status).toBe(400);
    const errorObj = response.body.errorsMessages[0];

    expect(errorObj).toBeDefined();
    expect(errorObj.message).toContain('Конфликт расписания');
    expect(errorObj.field).toBe('logic');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Events Update (e2e)', () => {
    let eventId: string;

    beforeEach(async () => {
      const createDto = {
        title: 'Initial Event',
        description: 'Description for testing updates 123',
        maxParticipants: 15,
        startTime: new Date(Date.now() + 1000000).toISOString(),
        endTime: new Date(Date.now() + 2000000).toISOString(),
        location: 'Main Hall',
        category: 'art',
      };

      const res = await request(app.getHttpServer()).post('/events').set('Authorization', `Bearer ${accessToken}`).send(createDto);

      eventId = res.body.id;
    });

    it('должен успешно обновить название и описание (Positive)', async () => {
      const updateDto = {
        title: 'New Title',
        description: 'Brand new description for this event',
      };

      const res = await request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New Title');
      expect(res.body.description).toBe('Brand new description for this event');
    });

    it('не должен позволить уменьшить лимит мест ниже количества уже записанных участников', async () => {
      await dataSource.getRepository(EventEntity).update(eventId, { currentParticipantsCount: 10 });

      const res = await request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ maxParticipants: 5 });

      expect(res.status).toBe(400);
      expect(res.body.errorsMessages[0].message).toContain('уже продано 10 билетов');
    });

    it('должен выдать ошибку при попытке перенести ивент на время, занятое другим ивентом', async () => {
      const futureStart = new Date(Date.now() + 5 * 60 * 60 * 1000);
      const futureEnd = new Date(Date.now() + 6 * 60 * 60 * 1000);

      const secondEventRes = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Future Event',
          description: 'I exist peacefully in the future',
          maxParticipants: 10,
          startTime: futureStart.toISOString(),
          endTime: futureEnd.toISOString(),
          location: 'Future Hall',
          category: 'other',
        })
        .expect(201);

      const res = await request(app.getHttpServer()).patch(`/events/${eventId}`).set('Authorization', `Bearer ${accessToken}`).send({
        startTime: futureStart.toISOString(),
        endTime: futureEnd.toISOString(),
      });

      expect(res.status).toBe(400);
      expect(res.body.errorsMessages[0].message).toContain('Конфликт!');
    });
  });
});
