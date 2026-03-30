import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OrderCompleteEvent } from '../order/order-event-publisher.service';
import { NotificationsService } from './notifications.service';

@Processor('notifications-queue')
@Injectable()
export class NotificationsConsumer extends WorkerHost {
  private readonly logger = new Logger(NotificationsConsumer.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<OrderCompleteEvent>): Promise<void> {
    if (job.name !== 'order.success') {
      return;
    }

    this.logger.log(
      `Processing notification for payment: ${job.data.orderId}, order: ${job.data.orderId}`,
    );

    try {
      const { userId, amount, orderId } = job.data;
      const message = `결제가 완료되었습니다. (결제금액: ${amount.toLocaleString('ko-KR')}원)`;

      await this.notificationsService.createNotification(
        userId,
        message,
        'PAYMENT',
        orderId,
      );

      this.logger.log(
        `Successfully created notification for user ${userId}, order ${orderId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process notification for order ${job.data.orderId}`,
        error,
      );
      throw error;
    }
  }
}
