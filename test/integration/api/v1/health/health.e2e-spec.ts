import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { HealthModule } from '../../../../../src/modules/health/health.module';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';

describe('HEALTH ROUTES', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
        }),
        HealthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('GET /api/v1/health', () => {
    it('Returning OK', async () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect({
          status: 'ok',
          info: { pg_database: { status: 'up' } },
          error: {},
          details: { pg_database: { status: 'up' } },
        });
    });
  });

  describe('GET /api/v1/health/detailed', () => {
    it('Returning OK', async () => {
      return request(app.getHttpServer())
        .get('/health/detailed')
        .expect(200)
        .expect({
          status: 'ok',
          info: {
            database: { status: 'up' },
            memory_heap: { status: 'up' },
            storage: { status: 'up' },
          },
          error: {},
          details: {
            database: { status: 'up' },
            memory_heap: { status: 'up' },
            storage: { status: 'up' },
          },
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
