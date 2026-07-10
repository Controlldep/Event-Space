import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { cleanDatabase } from '../../helpers/db-cleaner';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../../../apps/events/src/app.module';
import { CustomHttpException, DomainExceptionCode } from '../../../libs/exceptions/src/domain.exceptions';
import { CustomExceptionFilter } from '../../../libs/exceptions/src/exceptionts-filter';
import { LoggingInterceptor } from '../../../apps/events/src/core/interceptors/logging.interceptor';
import { EventEntity } from '../../../apps/events/src/modules/events/domain/event.entity';

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

    const uniqueEmail = `org-${randomUUID()}@test.com`;
    const deviceId = randomUUID();
    const password = 'password123';

    const regRes = await request(app.getHttpServer())
      .post('/auth/registration')
      .set('user-agent', 'TestAgent')
      .set('x-device-id', deviceId)
      .send({
        email: uniqueEmail,
        password: password,
        fullName: 'Ivan Организатор',
        role: 'organizer',
      })
      .expect(200);

    if (regRes.body.accessToken) {
      accessToken = regRes.body.accessToken;
    } else {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .set('user-agent', 'TestAgent')
        .set('x-device-id', deviceId)
        .send({ email: uniqueEmail, password: password })
        .expect(200);
      accessToken = loginRes.body.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('должен создать ивент (успешно)', async () => {
    const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // +2 часа
    const endTime = new Date(Date.now() + 4 * 60 * 60 * 1000); // +4 часа

    const createDto = {
      title: 'Rock Show',
      description: 'Super mega description more than 10 chars',
      maxParticipants: 100,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      location: 'Moscow',
      category: 'vocal',
    };

    const res = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createDto)
      .expect(201);

    expect(res.body.title).toBe('Rock Show');
  });

  it('должен вернуть 400 при конфликте расписания (правило буфера в 1 час)', async () => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 2);

    const firstEventDto = {
      title: 'First Concert',
      description: 'First event description more than 10 chars',
      maxParticipants: 50,
      startTime: new Date(baseDate.setHours(14, 0, 0, 0)).toISOString(),
      endTime: new Date(baseDate.setHours(16, 0, 0, 0)).toISOString(),
      location: 'Main Hall',
      category: 'vocal',
    };
    await request(app.getHttpServer()).post('/events').set('Authorization', `Bearer ${accessToken}`).send(firstEventDto).expect(201);

    const secondEventDto = {
      title: 'Conflicting Event',
      description: 'This should fail because it is too close',
      maxParticipants: 30,
      startTime: new Date(baseDate.setHours(16, 30, 0, 0)).toISOString(), // Всего 30 мин после первого
      endTime: new Date(baseDate.setHours(18, 0, 0, 0)).toISOString(),
      location: 'Small Hall',
      category: 'art',
    };

    const response = await request(app.getHttpServer()).post('/events').set('Authorization', `Bearer ${accessToken}`).send(secondEventDto);

    expect(response.status).toBe(400);
    expect(response.body.errorsMessages[0].message).toContain('Конфликт расписания');
  });

  // --- ТЕСТЫ ОБНОВЛЕНИЯ ---

  describe('Events Update (e2e)', () => {
    let eventId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Initial Event',
          description: 'Description for testing updates 123',
          maxParticipants: 15,
          startTime: new Date(Date.now() + 10000000).toISOString(),
          endTime: new Date(Date.now() + 20000000).toISOString(),
          location: 'Main Hall',
          category: 'art',
        });
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
        .send(updateDto)
        .expect(200);

      expect(res.body.title).toBe('New Title');
    });

    it('не должен позволить уменьшить лимит мест ниже количества уже записанных участников', async () => {
      await dataSource.getRepository(EventEntity).update(eventId, { currentParticipantsCount: 10 });

      const res = await request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ maxParticipants: 5 });

      expect(res.status).toBe(400);
      expect(res.body.errorsMessages[0].message).toContain('продано 10 билетов');
    });

    it('должен выдать ошибку при попытке перенести ивент на время, занятое другим ивентом', async () => {
      const futureStart = new Date(Date.now() + 100 * 60 * 60 * 1000);
      const futureEnd = new Date(Date.now() + 102 * 60 * 60 * 1000);

      await request(app.getHttpServer())
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
    });
  });
});
