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

  async create(userId: number, productId: number, pointsUsed?: number): Promise<Order> {
    return this.orderRepository.save(Order.create(userId, productId, pointsUsed));
  }

  async save(order: Order) {
    return this.orderRepository.save(order);
  }
}
