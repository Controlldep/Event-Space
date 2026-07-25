import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { cleanDatabase } from '../../../../test/helpers/db-cleaner';
import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import { CustomHttpException, DomainExceptionCode } from '@app/exceptions/domain.exceptions';
import { CustomExceptionFilter } from '@app/exceptions/exceptionts-filter';
import { UserRole } from '../domain/enum/user-role.type';
import { UserEntity } from '../domain/user.entity';
import { SessionEntity } from '../domain/session.entity';
import { AppModule } from '../app.module';

describe('Auth (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;

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
          const details = errors.map((error) => ({ property: error.property, constraints: error.constraints }));
          throw new CustomHttpException(DomainExceptionCode.BAD_REQUEST, 'Validation failed', details);
        },
      }),
    );
    app.useGlobalFilters(new CustomExceptionFilter());

    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.query('TRUNCATE TABLE "session", "users" RESTART IDENTITY CASCADE');
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. должен вернуть 401 при доступе к защищенному эндпоинту без токена', () => {
    return request(app.getHttpServer()).get('/auth/profile').expect(401);
  });

  it('2. должен успешно зарегистрировать пользователя (201/200)', async () => {
    const email = `reg-${randomUUID()}@test.com`;
    const response = await request(app.getHttpServer())
      .post('/auth/registration')
      .set('user-agent', 'TestAgent')
      .send({ fullName: 'Ivan Ivanov', role: UserRole.USER, email, password: 'password123' })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('deviceId');
    expect(response.get('Set-Cookie')!.some((c) => c.includes('refreshToken'))).toBe(true);

    const user = await dataSource.getRepository(UserEntity).findOneBy({ email });
    expect(user?.fullName).toBe('Ivan Ivanov');
  });

  it('3. должен вернуть 400, если отсутствуют обязательные данные (User-Agent)', async () => {
    const email = `bad-${randomUUID()}@test.com`;
    const response = await request(app.getHttpServer())
      .post('/auth/registration')
      .send({ fullName: 'Ivan', role: UserRole.USER, email, password: 'password123' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errorsMessages');
  });

  it('4. должен вернуть 400, если пользователь с таким email уже существует', async () => {
    const email = `dup-${randomUUID()}@test.com`;
    const dto = { fullName: 'Ivan Ivanov', role: UserRole.USER, email, password: 'password123' };

    await request(app.getHttpServer()).post('/auth/registration').set('user-agent', 'Agent').send(dto).expect(200);
    const response = await request(app.getHttpServer()).post('/auth/registration').set('user-agent', 'Agent').send(dto);

    expect(response.status).toBe(400);
    expect(response.body.errorsMessages[0].field).toBe('logic');
  });

  it('5. логин должен обновлять существующую сессию, созданную при регистрации', async () => {
    const email = `upd-${randomUUID()}@test.com`;
    const loginDto = { email, password: 'password123' };

    const regResponse = await request(app.getHttpServer())
      .post('/auth/registration')
      .set('user-agent', 'Initial Agent')
      .send({ fullName: 'Ivan Ivanov', role: UserRole.USER, ...loginDto })
      .expect(200);

    const actualDeviceId = regResponse.body.deviceId;
    expect(actualDeviceId).toBeDefined();

    await request(app.getHttpServer())
      .post('/auth/login')
      .set('user-agent', 'Updated Agent')
      .set('x-device-id', actualDeviceId)
      .send(loginDto)
      .expect(200);

    const user = await dataSource.getRepository(UserEntity).findOneBy({ email });
    const sessions = await dataSource.getRepository(SessionEntity).find({
      where: { userId: user!.id },
    });

    expect(sessions.length).toBe(1);
    expect(sessions[0].userAgent).toBe('Updated Agent');
    expect(sessions[0].deviceId).toBe(actualDeviceId);
  });

  it('6. должен вернуть 401 при логине, если пароль неверный', async () => {
    const email = `wrong-pass-${randomUUID()}@test.com`;
    await request(app.getHttpServer())
      .post('/auth/registration')
      .set('user-agent', 'Agent')
      .send({ fullName: 'Ivan Ivanov', role: UserRole.USER, email, password: 'correctPassword' })
      .expect(200);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('user-agent', 'Agent')
      .send({ email, password: 'WRONG_PASSWORD' });

    expect(response.status).toBe(401);
  });

  it('7. должен вернуть 401 при логине, если email не существует', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('user-agent', 'Agent')
      .send({ email: `nobody-${randomUUID()}@test.com`, password: 'anyPassword' });

    expect(response.status).toBe(401);
  });

  it('8. должен успешно разлогинить пользователя и удалить сессию из базы', async () => {
    const email = `logout-${randomUUID()}@test.com`;
    const deviceId = randomUUID();

    const regRes = await request(app.getHttpServer())
      .post('/auth/registration')
      .set('user-agent', 'Agent')
      .set('x-device-id', deviceId)
      .send({ fullName: 'Ivan Ivanov', role: UserRole.USER, email, password: 'password123' });

    const cookie = regRes.get('Set-Cookie')!;

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('user-agent', 'Agent')
      .set('x-device-id', deviceId)
      .set('Cookie', cookie)
      .expect(204);

    const user = await dataSource.getRepository(UserEntity).findOneBy({ email });
    const sessions = await dataSource.getRepository(SessionEntity).find({ where: { userId: user!.id } });
    expect(sessions.length).toBe(0);
  });

  it('9. должен вернуть 401 при попытке повторного рефреша после логаута', async () => {
    const email = `ref-fail-${randomUUID()}@test.com`;
    const regRes = await request(app.getHttpServer())
      .post('/auth/registration')
      .set('user-agent', 'Agent')
      .send({ fullName: 'Ivan Ivanov', role: UserRole.USER, email, password: 'password123' });

    const cookie = regRes.get('Set-Cookie')!;

    await request(app.getHttpServer()).post('/auth/logout').set('user-agent', 'Agent').set('Cookie', cookie).expect(204);

    await request(app.getHttpServer()).post('/auth/refresh-token').set('user-agent', 'Agent').set('Cookie', cookie).expect(401);
  });
});
