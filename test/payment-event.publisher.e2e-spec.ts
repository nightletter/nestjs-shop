import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { PaymentEventPublisher } from '../src/payment/payment-event.publisher';
import configuration from '../src/config/configuration';

describe('PaymentEventPublisher (e2e)', () => {
  let app: INestApplication;
  let paymentEventPublisher: PaymentEventPublisher;
  let paymentQueue: Queue;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            connection: {
              host: configService.get<string>('redis.host'),
              port: configService.get<number>('redis.port'),
            },
          }),
        }),
        BullModule.registerQueue({
          name: 'payment-queue',
        }),
      ],
      providers: [PaymentEventPublisher],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    paymentEventPublisher = moduleFixture.get<PaymentEventPublisher>(
      PaymentEventPublisher,
    );
    paymentQueue = moduleFixture.get<Queue>(getQueueToken('payment-queue'));
  });

  afterAll(async () => {
    // Clean up: remove all jobs from the queue
    if (paymentQueue) {
      try {
        await paymentQueue.drain();
        await paymentQueue.clean(0, 1000, 'completed');
        await paymentQueue.clean(0, 1000, 'failed');
        await paymentQueue.close();
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    if (app) {
      await app.close();
    }
  });

  describe('publishPaymentSuccess', () => {
    it('should successfully publish payment success event to BullMQ', async () => {
      // Arrange
      const approvedAt = new Date('2026-03-26T11:00:00Z');
      const eventData = {
        paymentId: 123,
        orderId: 456,
        userId: 789,
        paymentKey: 'e2e-test-payment-key-xyz',
        method: 'CARD',
        amount: 75000,
        approvedAt,
      };

      // Act
      await paymentEventPublisher.publishPaymentSuccess(eventData);

      // Wait a bit for the job to be added
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Assert
      const jobs = await paymentQueue.getJobs(['waiting', 'completed']);
      expect(jobs.length).toBeGreaterThan(0);

      const publishedJob = jobs.find(
        (job) =>
          job.name === 'payment.success' &&
          job.data.paymentId === 123 &&
          job.data.orderId === 456,
      );

      expect(publishedJob).toBeDefined();
      expect(publishedJob!.data).toMatchObject({
        event: 'payment.success',
        paymentId: 123,
        orderId: 456,
        userId: 789,
        paymentKey: 'e2e-test-payment-key-xyz',
        method: 'CARD',
        amount: 75000,
        approvedAt: approvedAt.toISOString(),
      });
      expect(publishedJob!.data.timestamp).toBeDefined();
      expect(typeof publishedJob!.data.timestamp).toBe('string');
    });

    it('should add timestamp in ISO format', async () => {
      // Arrange
      const eventData = {
        paymentId: 999,
        orderId: 888,
        userId: 777,
        paymentKey: 'timestamp-test-key',
        method: 'TRANSFER',
        amount: 50000,
        approvedAt: new Date(),
      };

      const beforePublish = new Date();

      // Act
      await paymentEventPublisher.publishPaymentSuccess(eventData);

      // Wait for the job to be added
      await new Promise((resolve) => setTimeout(resolve, 500));

      const afterPublish = new Date();

      // Assert
      const jobs = await paymentQueue.getJobs(['waiting', 'completed']);
      const publishedJob = jobs.find(
        (job) =>
          job.name === 'payment.success' &&
          job.data.paymentId === 999 &&
          job.data.paymentKey === 'timestamp-test-key',
      );

      expect(publishedJob).toBeDefined();

      const timestamp = new Date(publishedJob!.data.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(
        beforePublish.getTime(),
      );
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterPublish.getTime());

      // Verify ISO 8601 format
      expect(publishedJob!.data.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should handle multiple concurrent publishes', async () => {
      // Arrange
      const events = Array.from({ length: 5 }, (_, i) => ({
        paymentId: 1000 + i,
        orderId: 2000 + i,
        userId: 3000 + i,
        paymentKey: `concurrent-test-key-${i}`,
        method: 'CARD',
        amount: 10000 * (i + 1),
        approvedAt: new Date(),
      }));

      // Act
      await Promise.all(
        events.map((event) =>
          paymentEventPublisher.publishPaymentSuccess(event),
        ),
      );

      // Wait for all jobs to be added
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Assert
      const jobs = await paymentQueue.getJobs(['waiting', 'completed']);

      for (let i = 0; i < 5; i++) {
        const job = jobs.find(
          (j) =>
            j.name === 'payment.success' &&
            j.data.paymentId === 1000 + i &&
            j.data.paymentKey === `concurrent-test-key-${i}`,
        );

        expect(job).toBeDefined();
        expect(job!.data.orderId).toBe(2000 + i);
        expect(job!.data.userId).toBe(3000 + i);
        expect(job!.data.amount).toBe(10000 * (i + 1));
      }
    });
  });
});
