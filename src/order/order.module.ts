import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TossPaymentClient } from './toss-payment.client';
import { Order } from './entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), HttpModule, AuthModule],
  controllers: [OrderController],
  providers: [OrderService, TossPaymentClient],
})
export class OrderModule {}
