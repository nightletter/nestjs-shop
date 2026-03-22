import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductCategory } from '../../products/entities/product-category.entity';
import {
  ProductOption,
  ProductSize,
} from '../../products/entities/product-option.entity';
import { CartItem } from '../../cart/entities/cart-item.entity';
import { runOnTransactionCommit, Transactional } from 'typeorm-transactional';
import { getTransactionalContext } from 'typeorm-transactional/dist/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
    @InjectRepository(ProductCategory)
    private readonly categoryRepository: Repository<ProductCategory>,
    @InjectRepository(ProductOption)
    private readonly optionRepository: Repository<ProductOption>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheService: CacheService,
    private readonly orderQueuePublisherService: OrderQueuePublisherService,
  ) {}

  async seed(): Promise<void> {
    await this.insertSamples();
    this.logger.log('Sample data has been seeded');
  }

  @Transactional()
  async insertSamples(): Promise<void> {
    const isActiveTx = getTransactionalContext().active;
    this.logger.log('isActiveTx', isActiveTx);

    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = await this.userRepository.save(
      this.userRepository.create({
        email: 'sample@example.com',
        password: hashedPassword,
        nickname: 'sample',
        isActive: true,
      }),
    );

    const outerCategory = await this.categoryRepository.save(
      this.categoryRepository.create({
        code: 'outer',
        name: '아우터',
      }),
    );
    await this.categoryRepository.save(
      this.categoryRepository.create({
        code: 'top',
        name: '상의',
      }),
    );
    await this.categoryRepository.save(
      this.categoryRepository.create({
        code: 'bottom',
        name: '하의',
      }),
    );

    const product = await this.productRepository.save(
      this.productRepository.create({
        name: 'Sample Outer Jacket',
        categoryId: outerCategory.id,
        description: 'Sample product description.',
        material: 'Cotton 100%',
        origin: 'Korea',
        washingMethod: 'Hand wash separately',
        price: 99000,
        salePrice: 79000,
      }),
    );

    await this.optionRepository.save(
      this.optionRepository.create({
        productId: product.id,
        size: ProductSize.S,
        stock: 3,
      }),
    );
    const mediumOption = await this.optionRepository.save(
      this.optionRepository.create({
        productId: product.id,
        size: ProductSize.M,
        stock: 10,
      }),
    );
    await this.optionRepository.save(
      this.optionRepository.create({
        productId: product.id,
        size: ProductSize.L,
        stock: 5,
      }),
    );

    await this.cartItemRepository.save(
      this.cartItemRepository.create({
        userId: user.id,
        productOptionId: mediumOption.id,
        quantity: 1,
      }),
    );

    await this.cacheService.setCache('bootstrap', product.id);
    const cachedProductId =
      await this.cacheService.getCache<number>('bootstrap');
    this.logger.log(cachedProductId);

    runOnTransactionCommit(() => {
      this.eventEmitter.emit('application.bootstrap', {
        product: product,
      });
      void this.orderQueuePublisherService.publishBootstrapProductCreated(
        product.id,
      );
    });
  }
}
