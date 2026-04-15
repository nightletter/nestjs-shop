import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '@/app.module';
import { User } from '@/users/entities/user.entity';
import { Product } from '@/products/entities/product.entity';
import { Order } from '@/order/entities/order.entity';
import { Point } from '@/points/entities/point.entity';
import { PointBalance } from '@/points/entities/point-balance';

describe('Points Feature 5 - E2E Test', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let userId: number;
  let productId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);

    // 테스트 사용자 생성
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'testuser',
        password: 'password123',
      })
      .expect(201);

    // 로그인하여 토큰 획득
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'testuser',
        password: 'password123',
      })
      .expect(200);

    authToken = loginResponse.body.accessToken;

    // 사용자 ID 조회
    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { username: 'testuser' } });
    userId = user.id;

    // 테스트 상품 생성
    const productRepo = dataSource.getRepository(Product);
    const product = await productRepo.save({
      name: '테스트 상품',
      category: '아우터',
      price: 50000,
      salePrice: 50000,
      sizes: JSON.stringify(['M', 'L']),
      material: '면 100%',
      origin: '한국',
      careInstructions: '세탁기 가능',
    });
    productId = product.id;
  });

  afterAll(async () => {
    await dataSource.dropDatabase();
    await app.close();
  });

  it('결제 완료 시 10% 포인트 적립 - 포인트 미사용', async () => {
    // Given: 회원가입으로 5000 포인트 보유
    const balanceRepo = dataSource.getRepository(PointBalance);
    let balance = await balanceRepo.findOne({ where: { userId } });
    expect(balance.balance).toBe(5000);

    // When: 50,000원 상품 주문 (포인트 사용 안 함)
    const orderResponse = await request(app.getHttpServer())
      .post('/order')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productId,
        salePrice: 50000,
        useAllPoints: false,
      })
      .expect(201);

    const orderId = orderResponse.body.id;
    const orderNumber = orderResponse.body.orderNumber;

    // 결제 승인 (실제 Toss API 호출 없이 모킹 필요)
    // 여기서는 주문 상태만 직접 업데이트
    const orderRepo = dataSource.getRepository(Order);
    const order = await orderRepo.findOne({ where: { id: orderId } });
    order.status = 'confirmed';
    await orderRepo.save(order);

    // 이벤트 발행 후 Consumer 처리를 기다림
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Then: 5000원 (10%) 적립 → 총 10,000 포인트
    balance = await balanceRepo.findOne({ where: { userId } });
    expect(balance.balance).toBe(10000);

    // 포인트 내역 확인
    const pointRepo = dataSource.getRepository(Point);
    const points = await pointRepo.find({
      where: { userId, refType: 'order.complete' },
      order: { createdAt: 'DESC' },
    });

    expect(points.length).toBeGreaterThanOrEqual(1);
    const earnPoint = points.find((p) => p.amount > 0);
    expect(earnPoint.amount).toBe(5000);
    expect(earnPoint.description).toContain('10%');
  });

  it('결제 완료 시 10% 포인트 적립 - 포인트 사용', async () => {
    // Given: 현재 10,000 포인트 보유
    const balanceRepo = dataSource.getRepository(PointBalance);
    let balance = await balanceRepo.findOne({ where: { userId } });
    const initialBalance = balance.balance;

    // When: 50,000원 상품 주문 (10,000 포인트 사용)
    const orderResponse = await request(app.getHttpServer())
      .post('/order')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productId,
        salePrice: 50000,
        useAllPoints: true, // 10,000 포인트 사용
      })
      .expect(201);

    const orderId = orderResponse.body.id;

    // 주문 상태 업데이트
    const orderRepo = dataSource.getRepository(Order);
    const order = await orderRepo.findOne({ where: { id: orderId } });
    order.status = 'confirmed';
    await orderRepo.save(order);

    // Consumer 처리 대기
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Then:
    // - 10,000 포인트 차감
    // - 실제 결제 금액: 50,000 - 10,000 = 40,000
    // - 적립: 40,000 * 0.1 = 4,000
    // - 최종 잔액: 10,000 - 10,000 + 4,000 = 4,000
    balance = await balanceRepo.findOne({ where: { userId } });
    expect(balance.balance).toBe(4000);

    // 포인트 내역 확인
    const pointRepo = dataSource.getRepository(Point);
    const recentPoints = await pointRepo.find({
      where: { userId, refId: orderId },
      order: { createdAt: 'DESC' },
    });

    expect(recentPoints.length).toBe(2); // 차감 1개 + 적립 1개

    const usePoint = recentPoints.find((p) => p.amount < 0);
    const earnPoint = recentPoints.find((p) => p.amount > 0);

    expect(usePoint.amount).toBe(-10000);
    expect(earnPoint.amount).toBe(4000);
  });

  it('소액 결제 시 적립 금액이 0이면 적립 안 함', async () => {
    // Given: 현재 잔액
    const balanceRepo = dataSource.getRepository(PointBalance);
    const beforeBalance = await balanceRepo.findOne({ where: { userId } });
    const initialBalance = beforeBalance.balance;

    // When: 5원 상품 주문 (적립 예상: 0.5원 → 0원)
    const productRepo = dataSource.getRepository(Product);
    const cheapProduct = await productRepo.save({
      name: '초저가 상품',
      category: '상의',
      price: 5,
      salePrice: 5,
      sizes: JSON.stringify(['M']),
      material: '면',
      origin: '한국',
      careInstructions: '손세탁',
    });

    const orderResponse = await request(app.getHttpServer())
      .post('/order')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productId: cheapProduct.id,
        salePrice: 5,
        useAllPoints: false,
      })
      .expect(201);

    const orderId = orderResponse.body.id;

    // 주문 상태 업데이트
    const orderRepo = dataSource.getRepository(Order);
    const order = await orderRepo.findOne({ where: { id: orderId } });
    order.status = 'confirmed';
    await orderRepo.save(order);

    // Consumer 처리 대기
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Then: 적립 안 됨 (잔액 변화 없음)
    const afterBalance = await balanceRepo.findOne({ where: { userId } });
    expect(afterBalance.balance).toBe(initialBalance);
  });
});
