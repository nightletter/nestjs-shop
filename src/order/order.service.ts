import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { SuccessOrderDto } from './dto/success-order.dto';
import { TossPaymentClient } from './toss-payment.client';
import { TossPaymentConfirmResponseDto } from './dto/toss-payment-confirm-response.dto';
import { Order } from './entities/order.entity';
import { CreatedOrderDto } from './dto/created-order.dto';
import { PaymentProcessor } from '../payment/payment.processor';
import { CreateOrderRequest } from './dto/create-order.request';

@Injectable()
export class OrderService {
  constructor(
    private readonly tossPaymentClient: TossPaymentClient,
    private readonly paymentProcessor: PaymentProcessor,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  @Transactional()
  async create(userId: number, request: CreateOrderRequest) {
    // productValidator 로 가격 체크 해줘야함
    const order = await this.orderRepository.save(
      Order.create(userId, request.productId),
    );

    const payment = await this.paymentProcessor.create(order.id, userId);

    return plainToInstance(CreatedOrderDto, order, {
      excludeExtraneousValues: true,
    });
  }

  async confirm(param: SuccessOrderDto) {
    const findOrder = await this.orderRepository.findOne({
      where: {
        orderNumber: param.orderId,
      },
    });

    const confirmResult: TossPaymentConfirmResponseDto =
      await this.tossPaymentClient.confirm(param);
  }
}
