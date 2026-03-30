import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PaymentSuccessEvent } from '../payment/payment-event.publisher';
import { NotificationsService } from './notifications.service';

@Processor('notifications-queue')
@Injectable()
export class NotificationsConsumer extends WorkerHost {
  private readonly logger = new Logger(NotificationsConsumer.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<PaymentSuccessEvent>): Promise<void> {
    if (job.name !== 'payment.success') {
      return;
    }

    this.logger.log(
      `Processing notification for payment: ${job.data.paymentId}, order: ${job.data.orderId}`,
    );

    try {
      const { userId, amount, orderId, paymentId } = job.data;
      const message = `결제가 완료되었습니다. (결제금액: ${amount.toLocaleString('ko-KR')}원)`;

      await this.notificationsService.createNotification(
        userId,
        message,
        'PAYMENT',
        orderId,
        paymentId,
      );

      this.logger.log(
        `Successfully created notification for user ${userId}, payment ${paymentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process notification for payment ${job.data.paymentId}`,
        error,
      );
      throw error;
    }
  }
}
