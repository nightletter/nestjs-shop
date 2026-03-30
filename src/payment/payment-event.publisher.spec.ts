import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OrderEventPublisher } from '../order/order-event-publisher.service';

describe('PaymentEventPublisher', () => {
  let publisher: OrderEventPublisher;
  let mockQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderEventPublisher,
        {
          provide: getQueueToken('payment-queue'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    publisher = module.get<OrderEventPublisher>(OrderEventPublisher);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('publishPaymentSuccess', () => {
    it('should publish payment success event to queue', async () => {
      // Arrange
      const approvedAt = new Date('2026-03-26T10:00:00Z');
      const eventData = {
        paymentId: 1,
        orderId: 100,
        userId: 50,
        paymentKey: 'test-payment-key-123',
        method: 'CARD',
        amount: 50000,
        approvedAt,
      };

      mockQueue.add.mockResolvedValue({} as any);

      // Act
      await publisher.publishOrderComplete(eventData);

      // Assert
      expect(mockQueue.add).toHaveBeenCalledTimes(1);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'order.success',
        expect.objectContaining({
          event: 'order.success',
          paymentId: 1,
          orderId: 100,
          userId: 50,
          paymentKey: 'test-payment-key-123',
          method: 'CARD',
          amount: 50000,
          approvedAt,
          timestamp: expect.any(String),
        }),
        {
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      );
    });

    it('should add timestamp to the event', async () => {
      // Arrange
      const eventData = {
        paymentId: 1,
        orderId: 100,
        userId: 50,
        paymentKey: 'test-key',
        method: 'CARD',
        amount: 10000,
        approvedAt: new Date(),
      };

      mockQueue.add.mockResolvedValue({} as any);

      // Act
      const beforePublish = new Date().toISOString();
      await publisher.publishOrderComplete(eventData);
      const afterPublish = new Date().toISOString();

      // Assert
      const callArgs = mockQueue.add.mock.calls[0];
      const publishedEvent = callArgs[1];

      expect(publishedEvent).toHaveProperty('timestamp');
      expect(publishedEvent.timestamp).toBeDefined();
      expect(publishedEvent.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
      expect(publishedEvent.timestamp >= beforePublish).toBe(true);
      expect(publishedEvent.timestamp <= afterPublish).toBe(true);
    });

    it('should preserve all event data fields', async () => {
      // Arrange
      const approvedAt = new Date('2026-03-26T15:30:00Z');
      const eventData = {
        paymentId: 999,
        orderId: 888,
        userId: 777,
        paymentKey: 'unique-payment-key-xyz',
        method: 'TRANSFER',
        amount: 100000,
        approvedAt,
      };

      mockQueue.add.mockResolvedValue({} as any);

      // Act
      await publisher.publishOrderComplete(eventData);

      // Assert
      const callArgs = mockQueue.add.mock.calls[0];
      const publishedEvent = callArgs[1];

      expect(publishedEvent.event).toBe('order.success');
      expect(publishedEvent.paymentId).toBe(999);
      expect(publishedEvent.orderId).toBe(888);
      expect(publishedEvent.userId).toBe(777);
      expect(publishedEvent.paymentKey).toBe('unique-payment-key-xyz');
      expect(publishedEvent.method).toBe('TRANSFER');
      expect(publishedEvent.amount).toBe(100000);
      expect(publishedEvent.approvedAt).toBe(approvedAt);
    });

    it('should use correct queue options', async () => {
      // Arrange
      const eventData = {
        paymentId: 1,
        orderId: 100,
        userId: 50,
        paymentKey: 'test-key',
        method: 'CARD',
        amount: 10000,
        approvedAt: new Date(),
      };

      mockQueue.add.mockResolvedValue({} as any);

      // Act
      await publisher.publishOrderComplete(eventData);

      // Assert
      const callArgs = mockQueue.add.mock.calls[0];
      const queueOptions = callArgs[2];

      expect(queueOptions).toEqual({
        removeOnComplete: 100,
        removeOnFail: 100,
      });
    });

    it('should throw error when queue.add fails', async () => {
      // Arrange
      const eventData = {
        paymentId: 1,
        orderId: 100,
        userId: 50,
        paymentKey: 'test-key',
        method: 'CARD',
        amount: 10000,
        approvedAt: new Date(),
      };

      const error = new Error('Queue connection failed');
      mockQueue.add.mockRejectedValue(error);

      // Act & Assert
      await expect(publisher.publishOrderComplete(eventData)).rejects.toThrow(
        'Queue connection failed',
      );
    });
  });
});
