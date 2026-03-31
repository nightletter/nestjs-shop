import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { PaymentModule } from '../payment/payment.module';
import { RedisModule } from '../common/redis/redis.module';
import OrderService from './order.service';
import { OrderController } from './order.controller';
import { TossPaymentClient } from './toss-payment.client';
import { Order } from './entities/order.entity';
import { OrderValidator } from './order.validator';
import { Product } from '../products/entities/product.entity';
import { OrderEventPublisher } from '@/order/order-event-publisher.service';
import OrderTransactionService from '@/order/order-transaction.service';
import { OrderProcessor } from '@/order/order.processor';
import { Payment } from '@/payment/entities/payment.entity';
import { QueueNames } from '@/common/constants/queue-events.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Product, Payment]),
    HttpModule,
    AuthModule,
    PaymentModule,
    RedisModule,
    BullModule.registerQueue({
      name: QueueNames.POINTS,
    }),
    BullModule.registerQueue({
      name: QueueNames.NOTIFICATIONS,
    }),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    TossPaymentClient,
    OrderValidator,
    OrderEventPublisher,
    OrderProcessor,
    OrderTransactionService,
  ],
})
export class OrderModule {}
