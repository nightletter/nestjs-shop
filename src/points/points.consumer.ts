import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OrderCompleteEvent } from '../order/order-event-publisher.service';
import { PointsService } from './points.service';

@Processor('points-queue')
@Injectable()
export class PointsConsumer extends WorkerHost {
  private readonly logger = new Logger(PointsConsumer.name);

  constructor(private readonly pointsService: PointsService) {
    super();
  }

  async process(job: Job<OrderCompleteEvent>): Promise<void> {
    if (job.name !== 'order.success') {
      return;
    }

    this.logger.log(`Processing points for order: ${job.data.orderId}`);

    try {
      const { userId, amount, orderId} = job.data;
      const pointsToEarn = Math.floor(amount * 0.1);

      await this.pointsService.earnPoints(
        userId,
        pointsToEarn,
        '결제 완료 포인트 적립',
        orderId,
      );

      this.logger.log(
        `Successfully earned ${pointsToEarn} points for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process points for order ${job.data.orderId}`,
        error,
      );
      throw error;
    }
  }
}
