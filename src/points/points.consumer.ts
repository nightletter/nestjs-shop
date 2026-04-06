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
    if (job.name === QueueEvents.POINTS_USE) {
      await this.handlePointsUse(job.data);
    } else if (job.name === QueueEvents.POINTS_EARN) {
      await this.handlePointsEarn(job.data);
    }
  }

  private async handlePointsUse(data: OrderCompleteEvent): Promise<void> {
    const point = Point.create(
      data.userId,
      'order.complete',
      data.orderId,
      -data.pointsUsed,
      '주문 시 포인트 사용',
    );

    await this.pointsService.subtractPointWithBalance(point);
    this.logger.log(
      `Points used for order ${data.orderId}: -${data.pointsUsed}`,
    );
  }

  private async handlePointsEarn(data: OrderCompleteEvent): Promise<void> {
    // 결제 금액의 10% 적립 (실제 결제 금액 = 총 금액 - 사용한 포인트)
    const actualPayment = data.amount - data.pointsUsed;
    const earnAmount = Math.floor(actualPayment * 0.1);

    if (earnAmount > 0) {
      const point = Point.create(
        data.userId,
        'order.complete',
        data.orderId,
        earnAmount,
        '주문 완료 포인트 적립 (10%)',
      );

      await this.pointsService.earnPointWithBalance(point);
      this.logger.log(
        `Points earned for order ${data.orderId}: +${earnAmount}`,
      );
    }
  }
}
