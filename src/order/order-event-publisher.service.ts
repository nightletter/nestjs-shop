import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Order } from '@/order/entities/order.entity';
import { QueueEvents, QueueNames } from '@/common/constants/queue-events.constants';

export type OrderCompleteEvent = {
  event: typeof QueueEvents.ORDER_SUCCESS;
  orderId: number;
  userId: number;
  amount: number;
};

export type OrderFailureEvent = {
  event: typeof QueueEvents.ORDER_FAILURE;
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
    @InjectQueue(QueueNames.POINTS)
    private readonly pointsQueue: Queue<OrderEvent>,
    @InjectQueue(QueueNames.NOTIFICATIONS)
    private readonly notificationsQueue: Queue<OrderEvent>,
  ) {}

  async publishOrderComplete(order: Order): Promise<void> {
    const payload: OrderCompleteEvent = <OrderCompleteEvent>{
      orderId: order.id,
      userId: order.userId,
      amount: order.totalAmount,
    };

    await this.pointsQueue.add(QueueEvents.ORDER_SUCCESS, payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    await this.notificationsQueue.add(QueueEvents.ORDER_SUCCESS, payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }

  async publishPaymentFailure(
    event: Omit<OrderFailureEvent, 'event' | 'timestamp'>,
  ): Promise<void> {
    const payload: OrderFailureEvent = {
      event: QueueEvents.ORDER_FAILURE,
      ...event,
      timestamp: new Date().toISOString(),
    };

    await this.pointsQueue.add(QueueEvents.ORDER_FAILURE, payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    await this.notificationsQueue.add(QueueEvents.ORDER_FAILURE, payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }
}
