import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { NestExpressApplication } from '@nestjs/platform-express';
import hbs from 'hbs';
import { join } from 'path';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    initializeTransactionalContext();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.setBaseViewsDir(join(__dirname, '../src/views'));
    app.engine('html', hbs.__express);
    app.setViewEngine('html');
    app.useStaticAssets(join(__dirname, '../src/public'));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain('<title>SHOPPE — 로그인</title>');
      });
  });

  it('/products (GET)', () => {
    return request(app.getHttpServer())
      .get('/products')
      .expect(302)
      .expect('Location', '/');
  });

  it('/order/complate (GET)', () => {
    return request(app.getHttpServer())
      .get('/order/complate')
      .expect(302)
      .expect('Location', '/');
  });

  it('/style.css (GET)', () => {
    return request(app.getHttpServer())
      .get('/style.css')
      .expect(200)
      .expect('Content-Type', /text\/css/)
      .expect((res) => {
        expect(res.text).toContain(':root');
      });
  });
});
