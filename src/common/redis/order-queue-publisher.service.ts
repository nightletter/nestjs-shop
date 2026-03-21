import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

type BootstrapOrderMessage = {
  event: 'bootstrap.product.created';
  productId: number;
  source: 'database-seeder';
};

@Injectable()
export class OrderQueuePublisherService {
  constructor(
    @InjectQueue('order-queue')
    private readonly orderQueue: Queue<BootstrapOrderMessage>,
  ) {}

  async publishBootstrapProductCreated(productId: number): Promise<void> {
    await this.orderQueue.add(
      'bootstrap.product.created',
      {
        event: 'bootstrap.product.created',
        productId,
        source: 'database-seeder',
      },
      {
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );
  }
}
