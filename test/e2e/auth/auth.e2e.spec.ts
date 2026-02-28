import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { cleanDatabase } from '../../helpers/db-cleaner';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { Test, TestingModule } from '@nestjs/testing';
import { CustomExceptionFilter } from '../../../src/core/exceptions/exceptionts-filter';
import { LoggingInterceptor } from '../../../src/core/interceptors/logging.interceptor';
import { CustomHttpException, DomainExceptionCode } from '../../../src/core/exceptions/domain.exceptions';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { UserRole } from '../../../src/modules/users/domain/enum/user-role.type';
import { AuthRegistrationUserInputDto } from '../../../src/modules/users/api/input-dto/auth-registration-user.input.dto';
import { UserEntity } from '../../../src/modules/users/domain/user.entity';
import { SessionEntity } from '../../../src/modules/users/domain/session.entity';

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('должен вернуть 401 при доступе к защищенному эндпоинту без токена', () => {
    return request(app.getHttpServer()).get('/auth/profile').expect(401);
  });

  it('должен успешно зарегистрировать пользователя (201/200)', async () => {
    const registrationDto: AuthRegistrationUserInputDto = {
      fullName: 'Ivan Ivanov',
      role: UserRole.USER,
      email: 'vovak@test.com',
      password: 'password123',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/registration')
      .set('user-agent', 'TestAgent')
      .set('X-Forwarded-For', '127.0.0.1')
      .send(registrationDto)
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('deviceId');

    const cookies = response.get('Set-Cookie')!;
    expect(cookies.some((c) => c.includes('refreshToken'))).toBe(true);

    const user = await dataSource.getRepository(UserEntity).findOneBy({ email: registrationDto.email });
    expect(user).toBeDefined();
    expect(user?.fullName).toBe(registrationDto.fullName);
  });

  it('должен вернуть 400, если отсутствуют обязательные данные (User-Agent или IP)', async () => {
    const registrationDto: AuthRegistrationUserInputDto = {
      fullName: 'Ivan Ivanov',
      role: UserRole.USER,
      email: 'bad-request@test.com',
      password: 'password123',
    };

    const response = await request(app.getHttpServer()).post('/auth/registration').send(registrationDto);

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty('errorsMessages');
  });

  it('должен вернуть 400, если пользователь с таким email уже существует', async () => {
    const registrationDto: AuthRegistrationUserInputDto = {
      fullName: 'Ivan Ivanov',
      role: UserRole.USER,
      email: 'duplicate@test.com',
      password: 'password123',
    };

    await request(app.getHttpServer())
      .post('/auth/registration')
      .set('user-agent', 'TestAgent')
      .set('X-Forwarded-For', '127.0.0.1')
      .send(registrationDto)
      .expect(200);

    const response = await request(app.getHttpServer())
      .post('/auth/registration')
      .set('user-agent', 'TestAgent')
      .set('X-Forwarded-For', '127.0.0.1')
      .send(registrationDto);

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty('errorsMessages');
  });

  it('логин должен обновлять существующую сессию, созданную при регистрации', async () => {
    const loginDto = { email: 'update@test.com', password: 'password123' };

    const regRes = await request(app.getHttpServer())
      .post('/auth/registration')
      .set('user-agent', 'Initial Agent')
      .set('X-Forwarded-For', '1.1.1.1')
      .send({ fullName: 'Ivan Ivanov', role: UserRole.USER, ...loginDto });

    const deviceId = regRes.body.deviceId;

    await request(app.getHttpServer())
      .post('/auth/login')
      .set('user-agent', 'Updated Agent')
      .set('X-Forwarded-For', '2.2.2.2')
      .set('x-device-id', deviceId)
      .send(loginDto)
      .expect(200);

    const user = await dataSource.getRepository(UserEntity).findOneBy({ email: loginDto.email });
    const sessions = await dataSource.getRepository(SessionEntity).find({ where: { userId: user!.id } });

    expect(sessions.length).toBe(1); // ТЕПЕРЬ ТОЧНО 1
    expect(sessions[0].userAgent).toBe('Updated Agent');
    expect(sessions[0].ip).toBe('2.2.2.2');
  });

  describe('Логин (негативные сценарии)', () => {
    const loginDto = { email: 'exist@test.com', password: 'correctPassword123' };

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/auth/registration')
        .set('user-agent', 'TestAgent')
        .set('X-Forwarded-For', '1.1.1.1')
        .send({ fullName: 'Ivan Ivanov', role: UserRole.USER, ...loginDto });
    });

    it('должен вернуть 401, если пароль неверный', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('user-agent', 'TestAgent')
        .set('X-Forwarded-For', '1.1.1.1')
        .send({ email: loginDto.email, password: 'WRONG_PASSWORD' });

      expect(response.status).toBe(401);
    });

    it('должен вернуть 401, если email не существует', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('user-agent', 'TestAgent')
        .set('X-Forwarded-For', '1.1.1.1')
        .send({ email: 'nobody@test.com', password: 'anyPassword' });

      expect(response.status).toBe(401);
    });
  });

  it('должен выдать новую пару токенов через Cookies (Refresh Token)', async () => {
    const loginDto = {
      email: 'refresh-cookie@test.com',
      password: 'password123',
      fullName: 'Ivan Ivanov',
      role: UserRole.USER,
    };

    const regRes = await request(app.getHttpServer())
      .post('/auth/registration')
      .set('user-agent', 'TestAgent')
      .set('X-Forwarded-For', '1.1.1.1')
      .send(loginDto);

    const deviceId = regRes.body.deviceId;

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .set('user-agent', 'TestAgent')
      .set('X-Forwarded-For', '1.1.1.1')
      .set('x-device-id', deviceId)
      .send({ email: loginDto.email, password: loginDto.password });

    const cookie = loginRes.get('Set-Cookie') as string[];
    expect(cookie).toBeDefined();
    expect(cookie.length).toBeGreaterThan(0);

    await new Promise((res) => setTimeout(res, 1001));

    const refreshRes = await request(app.getHttpServer())
      .post('/auth/refresh-token')
      .set('user-agent', 'TestAgent')
      .set('X-Forwarded-For', '1.1.1.1')
      .set('Cookie', cookie)
      .send()
      .expect(200);

    const newCookie = refreshRes.get('Set-Cookie') as string[];
    expect(newCookie).toBeDefined();
    expect(newCookie).not.toEqual(cookie);

    expect(refreshRes.body.accessToken).toBeDefined();
    expect(refreshRes.body.accessToken).not.toBe(loginRes.body.accessToken);

    const user = await dataSource.getRepository(UserEntity).findOneBy({ email: loginDto.email });
    const sessions = await dataSource.getRepository(SessionEntity).find({ where: { userId: user!.id } });

    expect(sessions.length).toBe(1);
  });

  describe('Logout (Выход из системы)', () => {
    const loginDto = {
      email: 'logout-final@test.com',
      password: 'password123',
      fullName: 'Ivan Ivanov',
      role: UserRole.USER,
    };
    let cookie: string[];

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/auth/registration')
        .set('user-agent', 'LogoutAgent')
        .set('X-Forwarded-For', '1.1.1.1')
        .send(loginDto);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .set('user-agent', 'LogoutAgent')
        .set('X-Forwarded-For', '1.1.1.1')
        .send({ email: loginDto.email, password: loginDto.password });

      cookie = loginRes.get('Set-Cookie') as string[];
    });

    it('должен успешно разлогинить пользователя и удалить сессию из базы', async () => {
      const loginDto = {
        email: 'logout-pro@test.com',
        password: 'password123',
        fullName: 'Ivan Ivanov',
        role: UserRole.USER,
      };

      const regRes = await request(app.getHttpServer()).post('/auth/registration').set('user-agent', 'TestAgent').send(loginDto);

      const deviceId = regRes.body.deviceId;

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .set('user-agent', 'TestAgent')
        .set('x-device-id', deviceId)
        .send({ email: loginDto.email, password: loginDto.password });

      const cookie = loginRes.get('Set-Cookie') as string[];

      const logoutRes = await request(app.getHttpServer()).post('/auth/logout').set('user-agent', 'TestAgent').set('Cookie', cookie).send();

      expect(logoutRes.status).toBe(204);

      const user = await dataSource.getRepository(UserEntity).findOneBy({ email: loginDto.email });
      const sessions = await dataSource.getRepository(SessionEntity).find({ where: { userId: user!.id } });

      expect(sessions.length).toBe(0);
    });

    it('должен вернуть 401 при попытке повторного рефреша после логаута', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .set('user-agent', 'LogoutAgent')
        .set('X-Forwarded-For', '1.1.1.1')
        .set('Cookie', cookie)
        .expect(401);
    });
  });
});
