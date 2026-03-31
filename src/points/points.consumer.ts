import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OrderCompleteEvent } from '../order/order-event-publisher.service';
import PointsService from './points.service';
import {
  QueueEvents,
  QueueNames,
} from '@/common/constants/queue-events.constants';

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

    this.logger.log(`Processing points for order: ${job.data.orderId}`);
  }
}
