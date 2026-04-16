import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  OrderCompleteEvent,
  OrderEventPublisher,
} from './order-event-publisher.service';
import { Order } from './entities/order.entity';
import {
  QueueEvents,
  QueueNames,
} from '@/common/constants/queue-events.constants';

describe('OrderEventPublisher', () => {
  let service: OrderEventPublisher;
  let pointsQueue: jest.Mocked<Queue>;
  let notificationsQueue: jest.Mocked<Queue>;

  const mockOrder: Order = {
    id: 1,
    orderNumber: 'test-order-uuid',
    userId: 10,
    productId: 5,
    status: 'COMPLETED',
    totalAmount: 50000,
    balanceAmount: 40000,
    pointsUsed: 10000,
    createAt: new Date(),
  } as Order;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderEventPublisher,
        {
          provide: getQueueToken(QueueNames.POINTS),
          useValue: {
            add: jest.fn().mockResolvedValue({ id: 'job-id' }),
          },
        },
        {
          provide: getQueueToken(QueueNames.NOTIFICATIONS),
          useValue: {
            add: jest.fn().mockResolvedValue({ id: 'job-id' }),
          },
        },
      ],
    }).compile();

    service = module.get<OrderEventPublisher>(OrderEventPublisher);
    pointsQueue = module.get(getQueueToken(QueueNames.POINTS));
    notificationsQueue = module.get(getQueueToken(QueueNames.NOTIFICATIONS));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('publishOrderComplete', () => {
    it('should publish order complete events when pointsUsed > 0', async () => {
      await service.publishOrderComplete(mockOrder);

      expect(pointsQueue.add).toHaveBeenCalledTimes(2);
      expect(pointsQueue.add).toHaveBeenNthCalledWith(
        1,
        QueueEvents.POINTS_USE,
        expect.objectContaining({
          orderId: 1,
          userId: 10,
          amount: 50000,
          pointsUsed: 10000,
        }),
        expect.any(Object),
      );
      expect(pointsQueue.add).toHaveBeenNthCalledWith(
        2,
        QueueEvents.POINTS_EARN,
        expect.objectContaining({
          orderId: 1,
          userId: 10,
          amount: 50000,
          pointsUsed: 10000,
        }),
        expect.any(Object),
      );
    });

    it('should publish notifications event', async () => {
      await service.publishOrderComplete(mockOrder);

      expect(notificationsQueue.add).toHaveBeenCalledTimes(1);
      expect(notificationsQueue.add).toHaveBeenCalledWith(
        QueueEvents.ORDER_SUCCESS,
        expect.objectContaining({
          orderId: 1,
          userId: 10,
          amount: 50000,
          pointsUsed: 10000,
        }),
        expect.any(Object),
      );
    });

    it('should skip POINTS_USE job when pointsUsed is 0', async () => {
      const orderWithoutPoints: Order = {
        ...mockOrder,
        pointsUsed: 0,
      };

      await service.publishOrderComplete(orderWithoutPoints);

      const calledWith = <OrderCompleteEvent>{
        orderId: orderWithoutPoints.id,
        userId: orderWithoutPoints.userId,
        amount: orderWithoutPoints.totalAmount,
        pointsUsed: 0,
      };

      expect(pointsQueue.add).toHaveBeenCalledTimes(1);
      expect(pointsQueue.add).toHaveBeenCalledWith(
        QueueEvents.POINTS_EARN,
        calledWith,
        expect.any(Object),
      );
    });

    it('should always publish POINTS_EARN and ORDER_SUCCESS events', async () => {
      await service.publishOrderComplete(mockOrder);

      const pointsQueueCalls = pointsQueue.add.mock.calls;
      const notificationsQueueCalls = notificationsQueue.add.mock.calls;

      expect(
        pointsQueueCalls.some((call) => call[0] === QueueEvents.POINTS_EARN),
      ).toBe(true);
      expect(
        notificationsQueueCalls.some(
          (call) => call[0] === QueueEvents.ORDER_SUCCESS,
        ),
      ).toBe(true);
    });

    it('should pass correct payload structure to queues', async () => {
      await service.publishOrderComplete(mockOrder);

      const payload = pointsQueue.add.mock.calls[0][1];

      expect(payload).toEqual({
        orderId: 1,
        userId: 10,
        amount: 50000,
        pointsUsed: 10000,
      });
    });

    it('should set removeOnComplete and removeOnFail options', async () => {
      await service.publishOrderComplete(mockOrder);

      const options = pointsQueue.add.mock.calls[0][2];

      expect(options.removeOnComplete).toBe(100);
      expect(options.removeOnFail).toBe(100);
    });

    it('should handle different order amounts correctly', async () => {
      const largeOrder: Order = {
        ...mockOrder,
        totalAmount: 1000000,
        pointsUsed: 100000,
      };

      await service.publishOrderComplete(largeOrder);

      expect(pointsQueue.add).toHaveBeenCalledWith(
        QueueEvents.POINTS_EARN,
        expect.objectContaining({
          amount: 1000000,
          pointsUsed: 100000,
        }),
        expect.any(Object),
      );
    });

    it('should handle orders with different user and product IDs', async () => {
      const differentOrder: Order = {
        ...mockOrder,
        userId: 999,
        productId: 888,
      };

      await service.publishOrderComplete(differentOrder);

      expect(pointsQueue.add).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userId: 999,
          orderId: 1,
        }),
        expect.any(Object),
      );
    });

    it('should resolve successfully after all events are published', async () => {
      const result = await service.publishOrderComplete(mockOrder);

      expect(result).toBeUndefined();
      expect(pointsQueue.add).toHaveBeenCalled();
      expect(notificationsQueue.add).toHaveBeenCalled();
    });

    it('should reject if pointsQueue.add fails', async () => {
      pointsQueue.add.mockRejectedValueOnce(new Error('Queue error'));

      await expect(service.publishOrderComplete(mockOrder)).rejects.toThrow(
        'Queue error',
      );
    });

    it('should reject if notificationsQueue.add fails', async () => {
      notificationsQueue.add.mockRejectedValueOnce(
        new Error('Notification queue error'),
      );

      await expect(service.publishOrderComplete(mockOrder)).rejects.toThrow(
        'Notification queue error',
      );
    });
  });
});
