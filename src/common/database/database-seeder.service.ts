import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { runOnTransactionCommit, Transactional } from 'typeorm-transactional';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { CacheService } from '../redis/cache.service';
import { OrderQueuePublisherService } from '../redis/order-queue-publisher.service';

@Injectable()
export class DatabaseSeederService {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cacheService: CacheService,
    private readonly orderQueuePublisherService: OrderQueuePublisherService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async seed(): Promise<void> {
    await this.insertSamples();
    this.logger.log('Sample data has been seeded');
  }

  @Transactional()
  async insertSamples(): Promise<void> {
    const product = await this.productRepository.save(
      this.productRepository.create({
        name: 'Pro Wireless Studio Headphones',
        price: 259000,
        salePrice: 189000,
      }),
    );

    await this.cacheService.setCache('bootstrap', product.id);
    const cachedProductId =
      await this.cacheService.getCache<number>('bootstrap');
    this.logger.log(cachedProductId);

    runOnTransactionCommit(() => {
      this.eventEmitter.emit('application.bootstrap', {
        product,
      });
      void this.orderQueuePublisherService.publishBootstrapProductCreated(
        product.id,
      );
    });
  }
}
