import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

export type PaymentSuccessEvent = {
  event: 'payment.success';
  paymentId: number;
  orderId: number;
  userId: number;
  paymentKey: string;
  method: string;
  amount: number;
  approvedAt: Date;
  timestamp: string;
};

export type PaymentFailureEvent = {
  event: 'payment.failure';
  paymentId: number;
  orderId: number;
  userId: number;
  paymentKey: string;
  reason?: string;
  timestamp: string;
};

export type PaymentEvent = PaymentSuccessEvent | PaymentFailureEvent;

@Injectable()
export class PaymentEventPublisher {
  constructor(
    @InjectQueue('points-queue')
    private readonly pointsQueue: Queue<PaymentEvent>,
    @InjectQueue('notifications-queue')
    private readonly notificationsQueue: Queue<PaymentEvent>,
  ) {}

  async publishPaymentSuccess(
    event: Omit<PaymentSuccessEvent, 'event' | 'timestamp'>,
  ): Promise<void> {
    const payload: PaymentSuccessEvent = {
      event: 'payment.success',
      ...event,
      timestamp: new Date().toISOString(),
    };

    // 포인트 큐에 발행
    await this.pointsQueue.add('payment.success', payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    // 알림 큐에 발행
    await this.notificationsQueue.add('payment.success', payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }

  async publishPaymentFailure(
    event: Omit<PaymentFailureEvent, 'event' | 'timestamp'>,
  ): Promise<void> {
    const payload: PaymentFailureEvent = {
      event: 'payment.failure',
      ...event,
      timestamp: new Date().toISOString(),
    };

    // 포인트 큐에 발행
    await this.pointsQueue.add('payment.failure', payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    // 알림 큐에 발행
    await this.notificationsQueue.add('payment.failure', payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }
}
