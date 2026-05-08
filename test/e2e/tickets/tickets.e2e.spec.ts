import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { cleanDatabase } from '../../helpers/db-cleaner';
import { randomUUID } from 'crypto';
import { AppModule } from '../../../apps/events/src/app.module';
import { CustomHttpException, DomainExceptionCode } from '../../../apps/events/src/core/exceptions/domain.exceptions';
import { CustomExceptionFilter } from '../../../apps/events/src/core/exceptions/exceptionts-filter';

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
        exceptionFactory: () => {
          throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'Validation failed');
        },
      }),
    );
    app.useGlobalFilters(new CustomExceptionFilter());
    await app.init();
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);

    const orgEmail = `org-${randomUUID()}@test.com`;
    const orgDeviceId = randomUUID();

    const regRes = await request(app.getHttpServer())
      .post('/auth/registration')
      .set('user-agent', TEST_AGENT)
      .set('x-device-id', orgDeviceId)
      .send({
        email: orgEmail,
        password: 'password123',
        fullName: 'Ivan Организатор',
        role: 'organizer',
      })
      .expect(200);

    accessToken = regRes.body.accessToken;

    const createEventRes = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('user-agent', TEST_AGENT)
      .set('x-device-id', orgDeviceId)
      .send({
        title: 'Race Condition Test',
        description: 'Testing concurrency logic',
        location: 'Test Location',
        maxParticipants: 5,
        category: 'other',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 96400000).toISOString(),
      })
      .expect(201);

    eventId = createEventRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Покупка билетов', () => {
    it('должен успешно купить билет и увеличить счетчик', async () => {
      const userEmail = `user-${randomUUID()}@test.com`;
      const userDeviceId = randomUUID();

      const regRes = await request(app.getHttpServer())
        .post('/auth/registration')
        .set('user-agent', TEST_AGENT)
        .set('x-device-id', userDeviceId)
        .send({ email: userEmail, password: 'password123', fullName: 'New User', role: 'user' })
        .expect(200);

      const token = regRes.body.accessToken;

      const res = await request(app.getHttpServer())
        .post(`/tickets/${eventId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('user-agent', TEST_AGENT)
        .set('x-device-id', userDeviceId)
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });

    it('должен вернуть 400 при попытке купить второй билет тем же юзером', async () => {
      const email = `double-ticket-${randomUUID()}@test.com`;
      const deviceId = randomUUID();

      const regRes = await request(app.getHttpServer())
        .post('/auth/registration')
        .set('user-agent', TEST_AGENT)
        .set('x-device-id', deviceId)
        .send({
          email,
          password: 'password123',
          fullName: 'Double Buyer',
          role: 'user',
        })
        .expect(200);

      const userToken = regRes.body.accessToken;

      await request(app.getHttpServer())
        .post(`/tickets/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('user-agent', TEST_AGENT)
        .set('x-device-id', deviceId)
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(`/tickets/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('user-agent', TEST_AGENT)
        .set('x-device-id', deviceId);

      expect(res.status).toBe(400);
    });

    it('RACE CONDITION: 6 запросов на 3 места', async () => {
      const maxParticipants = 3;
      const requestsCount = 6;

      await dataSource.query(`UPDATE "events" SET "maxParticipants" = $1 WHERE "id" = $2`, [maxParticipants, eventId]);

      const clients: { token: string; deviceId: string }[] = [];

      for (let i = 0; i < requestsCount; i++) {
        const clientEmail = `race-user-${i}-${randomUUID()}@test.com`;
        const clientDeviceId = randomUUID();

        const regRes = await request(app.getHttpServer())
          .post('/auth/registration')
          .set('user-agent', TEST_AGENT)
          .set('x-device-id', clientDeviceId)
          .send({
            email: clientEmail,
            password: 'password123',
            fullName: `Winner ${i}`,
            role: 'user',
          })
          .expect(200);

        clients.push({
          token: regRes.body.accessToken,
          deviceId: clientDeviceId,
        });
      }

      await new Promise((res) => setTimeout(res, 200));

      const results = await Promise.all(
        clients.map((client, i) =>
          request(app.getHttpServer())
            .post(`/tickets/${eventId}`)
            .set('Authorization', `Bearer ${client.token}`)
            .set('user-agent', TEST_AGENT)
            .set('x-device-id', client.deviceId)
            .set('X-Forwarded-For', `192.168.5.${i}`)
            .send(),
        ),
      );

      const successes = results.filter((r) => r.status === 201);
      const failures = results.filter((r) => r.status === 400);

      console.log('Результаты гонки:', successes.length, 'успехов,', failures.length, 'ошибок');

      expect(successes.length).toBe(maxParticipants);
      expect(failures.length).toBe(requestsCount - maxParticipants);

      const eventRes = await request(app.getHttpServer()).get(`/events/${eventId}`);
      expect(eventRes.body.currentParticipantsCount).toBe(maxParticipants);
    }, 30000);
  });
});
