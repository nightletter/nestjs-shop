import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OrderCompleteEvent } from '@/order/order-event-publisher.service';
import {
  QueueEvents,
  QueueNames,
} from '@/common/constants/queue-events.constants';
import { Point } from '@/points/entities/point.entity';
import PointsService from '@/points/points.service';

@Processor(QueueNames.POINTS)
@Injectable()
export class PointsConsumer extends WorkerHost {
  private readonly logger = new Logger(PointsConsumer.name);

  constructor(private readonly pointsService: PointsService) {
    super();
  }

  async process(job: Job<OrderCompleteEvent>): Promise<void> {
    if (job.name !== QueueEvents.ORDER_SUCCESS) {
      return;
    }

    const point = Point.create(
      job.data.userId,
      'order.complete',
      job.data.orderId,
      -job.data.pointsUsed,
      '주문',
    );

    await this.pointsService.subtractPointWithBalance(point);

    this.logger.log(`Processing points for order: ${job.data.orderId}`);
  }
}
