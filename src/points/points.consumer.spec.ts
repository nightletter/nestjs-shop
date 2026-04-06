import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { PointsConsumer } from './points.consumer';
import PointsService from './points.service';
import { OrderCompleteEvent } from '@/order/order-event-publisher.service';
import { QueueEvents } from '@/common/constants/queue-events.constants';
import { Point } from './entities/point.entity';

describe('PointsConsumer', () => {
  let consumer: PointsConsumer;
  let pointsService: PointsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointsConsumer,
        {
          provide: PointsService,
          useValue: {
            subtractPointWithBalance: jest.fn(),
            earnPointWithBalance: jest.fn(),
          },
        },
      ],
    }).compile();

    consumer = module.get<PointsConsumer>(PointsConsumer);
    pointsService = module.get<PointsService>(PointsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('process - POINTS_USE', () => {
    it('포인트 사용 이벤트를 처리해야 함', async () => {
      const eventData: OrderCompleteEvent = {
        event: QueueEvents.ORDER_SUCCESS,
        orderId: 1,
        userId: 100,
        amount: 50000,
        pointsUsed: 5000,
      };

      const job = {
        name: QueueEvents.POINTS_USE,
        data: eventData,
      } as Job<OrderCompleteEvent>;

      await consumer.process(job);

      expect(pointsService.subtractPointWithBalance).toHaveBeenCalledTimes(1);
      expect(pointsService.subtractPointWithBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 100,
          refType: 'order.complete',
          refId: 1,
          amount: -5000,
          description: '주문 시 포인트 사용',
        }),
      );
    });

    it('포인트 사용이 0이면 음수가 되지 않아야 함', async () => {
      const eventData: OrderCompleteEvent = {
        event: QueueEvents.ORDER_SUCCESS,
        orderId: 2,
        userId: 200,
        amount: 50000,
        pointsUsed: 0,
      };

      const job = {
        name: QueueEvents.POINTS_USE,
        data: eventData,
      } as Job<OrderCompleteEvent>;

      await consumer.process(job);

      const call = (pointsService.subtractPointWithBalance as jest.Mock).mock
        .calls[0][0];
      expect(call.amount).toBe(-0); // -0은 JavaScript에서 0과 동일하지만 표현이 다름
      expect(call.userId).toBe(200);
    });
  });

  describe('process - POINTS_EARN', () => {
    it('결제 금액의 10%를 적립해야 함', async () => {
      const eventData: OrderCompleteEvent = {
        event: QueueEvents.ORDER_SUCCESS,
        orderId: 1,
        userId: 100,
        amount: 50000,
        pointsUsed: 0,
      };

      const job = {
        name: QueueEvents.POINTS_EARN,
        data: eventData,
      } as Job<OrderCompleteEvent>;

      await consumer.process(job);

      expect(pointsService.earnPointWithBalance).toHaveBeenCalledTimes(1);
      expect(pointsService.earnPointWithBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 100,
          refType: 'order.complete',
          refId: 1,
          amount: 5000, // 50000 * 0.1
          description: '주문 완료 포인트 적립 (10%)',
        }),
      );
    });

    it('포인트 사용 시 실제 결제 금액 기준으로 적립해야 함', async () => {
      const eventData: OrderCompleteEvent = {
        event: QueueEvents.ORDER_SUCCESS,
        orderId: 2,
        userId: 200,
        amount: 50000,
        pointsUsed: 10000,
      };

      const job = {
        name: QueueEvents.POINTS_EARN,
        data: eventData,
      } as Job<OrderCompleteEvent>;

      await consumer.process(job);

      // 실제 결제 금액: 50000 - 10000 = 40000
      // 적립: 40000 * 0.1 = 4000
      expect(pointsService.earnPointWithBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 4000,
        }),
      );
    });

    it('소수점 이하는 버림 처리해야 함', async () => {
      const eventData: OrderCompleteEvent = {
        event: QueueEvents.ORDER_SUCCESS,
        orderId: 3,
        userId: 300,
        amount: 12345,
        pointsUsed: 0,
      };

      const job = {
        name: QueueEvents.POINTS_EARN,
        data: eventData,
      } as Job<OrderCompleteEvent>;

      await consumer.process(job);

      // 12345 * 0.1 = 1234.5 → 1234 (버림)
      expect(pointsService.earnPointWithBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1234,
        }),
      );
    });

    it('적립 금액이 0 이하면 적립하지 않아야 함', async () => {
      const eventData: OrderCompleteEvent = {
        event: QueueEvents.ORDER_SUCCESS,
        orderId: 4,
        userId: 400,
        amount: 5,
        pointsUsed: 0,
      };

      const job = {
        name: QueueEvents.POINTS_EARN,
        data: eventData,
      } as Job<OrderCompleteEvent>;

      await consumer.process(job);

      // 5 * 0.1 = 0.5 → 0 (버림) → 적립 안 함
      expect(pointsService.earnPointWithBalance).not.toHaveBeenCalled();
    });
  });

  describe('process - unknown event', () => {
    it('알 수 없는 이벤트는 무시해야 함', async () => {
      const eventData: OrderCompleteEvent = {
        event: QueueEvents.ORDER_SUCCESS,
        orderId: 1,
        userId: 100,
        amount: 50000,
        pointsUsed: 0,
      };

      const job = {
        name: 'unknown.event',
        data: eventData,
      } as Job<OrderCompleteEvent>;

      await consumer.process(job);

      expect(pointsService.subtractPointWithBalance).not.toHaveBeenCalled();
      expect(pointsService.earnPointWithBalance).not.toHaveBeenCalled();
    });
  });
});
