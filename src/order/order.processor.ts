import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';

@Injectable()
export class OrderProcessor {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async execute(orderId: string, amount: number) {
    const order = await this.orderRepository.findOneBy({
      orderNumber: orderId,
    });

    if (order) {
      order.execute(amount);
    }
  }
}
