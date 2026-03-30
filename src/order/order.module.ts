import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PaymentModule } from '../payment/payment.module';
import { RedisModule } from '../common/redis/redis.module';
import OrderService from './order.service';
import { OrderController } from './order.controller';
import { TossPaymentClient } from './toss-payment.client';
import { Order } from './entities/order.entity';
import { OrderValidator } from './order.validator';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Product]),
    HttpModule,
    AuthModule,
    PaymentModule,
    RedisModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, TossPaymentClient, OrderValidator],
})
export class OrderModule {}
