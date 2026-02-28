import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CustomHttpException, DomainExceptionCode } from '../../../src/core/exceptions/domain.exceptions';
import { CustomExceptionFilter } from '../../../src/core/exceptions/exceptionts-filter';

const TEST_DEVICE = 'f3bce883-2981-4faa-9f8f-465ef0214b09';
const TEST_AGENT = 'TestAgent/1.0';

describe('Tickets (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let eventId: string;

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
        exceptionFactory: (errors) => {
          throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'Validation failed');
        },
      }),
    );
    app.useGlobalFilters(new CustomExceptionFilter());
    await app.init();
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE "tickets", "events", "session", "users" RESTART IDENTITY CASCADE');

    await request(app.getHttpServer()).post('/auth/registration').set('user-agent', TEST_AGENT).set('x-device-id', TEST_DEVICE).send({
      email: 'org@test.com',
      password: 'password123',
      fullName: 'Ivan Организатор',
      role: 'organizer',
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .set('user-agent', TEST_AGENT)
      .set('x-device-id', TEST_DEVICE)
      .send({ email: 'org@test.com', password: 'password123' });

    accessToken = loginRes.body.accessToken;

    const createEventRes = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('user-agent', TEST_AGENT)
      .set('x-device-id', TEST_DEVICE)
      .send({
        title: 'Race Condition Test',
        description: 'Testing concurrency',
        location: 'Test Location',
        maxParticipants: 5,
        category: 'other',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 96400000).toISOString(),
      });

    eventId = createEventRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Покупка билетов', () => {
    it('должен успешно купить билет и увеличить счетчик', async () => {
      const email = `unique-${Date.now()}@test.com`;
      const deviceId = 'f3bce883-2981-4faa-9f8f-465ef0214b09';

      await request(app.getHttpServer())
        .post('/auth/registration')
        .set('user-agent', TEST_AGENT)
        .set('x-device-id', deviceId)
        .send({ email, password: 'password123', fullName: 'New User', role: 'user' });

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .set('user-agent', TEST_AGENT)
        .set('x-device-id', deviceId)
        .send({ email, password: 'password123' });

      const token = loginRes.body.accessToken;

      const res = await request(app.getHttpServer())
        .post(`/tickets/${eventId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('user-agent', TEST_AGENT)
        .set('x-device-id', deviceId);

      if (res.status !== 201) console.log('Ошибка все еще тут:', res.body);
      expect(res.status).toBe(201);
    });

    it('должен вернуть 400 при попытке купить второй билет тем же юзером', async () => {
      await request(app.getHttpServer())
        .post(`/tickets/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('user-agent', TEST_AGENT)
        .set('x-device-id', TEST_DEVICE);

      const res = await request(app.getHttpServer())
        .post(`/tickets/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('user-agent', TEST_AGENT)
        .set('x-device-id', TEST_DEVICE);

      expect(res.status).toBe(400);
    });
    it('RACE CONDITION: 6 запросов на 3 места (ПОБЕДНЫЙ)', async () => {
      const maxParticipants = 3;
      const requestsCount = 6;

      await dataSource.query(`UPDATE "events" SET "maxParticipants" = $1 WHERE "id" = $2`, [maxParticipants, eventId]);
      const clients: { token: string; deviceId: string }[] = [];

      for (let i = 0; i < requestsCount; i++) {
        const email = `winner-user-${i}-${Date.now()}@test.com`;

        const regRes = await request(app.getHttpServer())
          .post('/auth/registration')
          .set('user-agent', TEST_AGENT)
          .set('X-Forwarded-For', `192.168.2.${i}`)
          .send({
            email,
            password: 'password123',
            fullName: `Winner ${i}`,
            role: 'user',
          });

        clients.push({
          token: regRes.body.accessToken,
          deviceId: regRes.body.deviceId,
        });
      }

      await new Promise((res) => setTimeout(res, 500));

      const results = await Promise.all(
        clients.map((client, i) =>
          request(app.getHttpServer())
            .post(`/tickets/${eventId}`)
            .set('Authorization', `Bearer ${client.token}`)
            .set('x-device-id', client.deviceId) // Передаем ТОТ ЖЕ девайс, что создал сервер
            .set('user-agent', TEST_AGENT)
            .set('X-Forwarded-For', `192.168.2.${i}`),
        ),
      );

      const statuses = results.map((r) => r.status);
      console.log('Статусы финальной гонки:', statuses);

      const successes = results.filter((r) => r.status === 201);
      const failures = results.filter((r) => r.status === 400);

      expect(successes.length).toBe(maxParticipants);
      expect(failures.length).toBe(requestsCount - maxParticipants);

      const eventRes = await request(app.getHttpServer()).get(`/events/${eventId}`);
      expect(eventRes.body.currentParticipantsCount).toBe(maxParticipants);
    }, 60000);
  });
});
