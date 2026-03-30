import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Order } from '@/order/entities/order.entity';

export type OrderCompleteEvent = {
  event: 'order.success';
  orderId: number;
  userId: number;
  amount: number;
};

export type OrderFailureEvent = {
  event: 'order.failure';
  paymentId: number;
  orderId: number;
  userId: number;
  paymentKey: string;
  reason?: string;
  timestamp: string;
};

export type OrderEvent = OrderCompleteEvent | OrderFailureEvent;

@Injectable()
export class OrderEventPublisher {
  constructor(
    @InjectQueue('points-queue')
    private readonly pointsQueue: Queue<OrderEvent>,
    @InjectQueue('notifications-queue')
    private readonly notificationsQueue: Queue<OrderEvent>,
  ) {}

  async publishOrderComplete(order: Order): Promise<void> {
    const payload: OrderCompleteEvent = <OrderCompleteEvent>{
      orderId: order.id,
      userId: order.userId,
      amount: order.totalAmount,
    };

    await this.pointsQueue.add('order.success', payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    await this.notificationsQueue.add('order.success', payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }

  async publishPaymentFailure(
    event: Omit<OrderFailureEvent, 'event' | 'timestamp'>,
  ): Promise<void> {
    const payload: OrderFailureEvent = {
      event: 'order.failure',
      ...event,
      timestamp: new Date().toISOString(),
    };

    await this.pointsQueue.add('order.failure', payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    await this.notificationsQueue.add('order.failure', payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }
}
