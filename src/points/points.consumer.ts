import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PaymentSuccessEvent } from '../payment/payment-event.publisher';
import { PointsService } from './points.service';

@Processor('points-queue')
@Injectable()
export class PointsConsumer extends WorkerHost {
  private readonly logger = new Logger(PointsConsumer.name);

  constructor(private readonly pointsService: PointsService) {
    super();
  }

  async process(job: Job<PaymentSuccessEvent>): Promise<void> {
    if (job.name !== 'payment.success') {
      return;
    }

    this.logger.log(
      `Processing points for payment: ${job.data.paymentId}, order: ${job.data.orderId}`,
    );

    try {
      const { userId, amount, orderId, paymentId } = job.data;
      const pointsToEarn = Math.floor(amount * 0.1);

      await this.pointsService.earnPoints(
        userId,
        pointsToEarn,
        '결제 완료 포인트 적립',
        orderId,
        paymentId,
      );

      this.logger.log(
        `Successfully earned ${pointsToEarn} points for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process points for payment ${job.data.paymentId}`,
        error,
      );
      throw error;
    }
  }
}
