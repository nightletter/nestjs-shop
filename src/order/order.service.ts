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

@Injectable()
export class OrderService {
  constructor(
    private readonly tossPaymentClient: TossPaymentClient,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  @Transactional()
  async create(userId: number) {
    const order = Order.create(userId);
    const savedOrder = await this.orderRepository.save(order);

    return plainToInstance(CreatedOrderDto, savedOrder, {
      excludeExtraneousValues: true,
    });
  }

  async confirm(param: SuccessOrderDto) {
    const findOrder = await this.orderRepository.findOne({
      where: { orderNumber: param.orderId },
    });

    const confirmResult: TossPaymentConfirmResponseDto =
      await this.tossPaymentClient.confirm(param);
  }
}
