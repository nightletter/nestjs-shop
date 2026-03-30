import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { SuccessOrderDto } from './dto/success-order.dto';
import { TossPaymentClient } from './toss-payment.client';
import { TossPaymentConfirmResponseDto } from './dto/toss-payment-confirm-response.dto';
import { Order } from './entities/order.entity';
import { CreatedOrderResponse } from './dto/created-order.response';
import { CreateOrderRequest } from './dto/create-order.request';
import { OrderEventPublisher } from '@/order/order-event-publisher.service';
import CacheService from '@/common/redis/cache.service';
import { OrderStatusResponse } from '@/order/dto/order-status.response';
import OrderTransactionService from '@/order/order-transaction.service';

@Injectable()
class OrderService {
  constructor(
    private readonly tossPaymentClient: TossPaymentClient,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly eventPublisher: OrderEventPublisher,
    private readonly cacheService: CacheService,
    private readonly orderTransactionService: OrderTransactionService,
  ) {}

  async create(userId: number, request: CreateOrderRequest) {
    const order = await this.orderTransactionService.createWithPayment(
      userId,
      request,
    );

    await this.cacheService.setCache('order', order.id, order.status);

    return plainToInstance(CreatedOrderResponse, order, {
      excludeExtraneousValues: true,
    });
  }

  async confirm(param: SuccessOrderDto) {
    await this.orderTransactionService.execute(param.orderId, param.amount);

    const confirmResult: TossPaymentConfirmResponseDto =
      await this.tossPaymentClient.confirm(param);

    const confirmOrder =
      await this.orderTransactionService.confirmWithPayment(confirmResult);

    await this.cacheService.setCache(
      'order',
      confirmOrder.id,
      confirmOrder.status,
    );

    await this.eventPublisher.publishOrderComplete(confirmOrder);
  }

  async getOrderStatus(
    userId: number,
    orderId: number,
  ): Promise<OrderStatusResponse> {
    const cachedStatus = await this.cacheService.getCache<string>(
      'order',
      orderId,
    );

    if (cachedStatus) {
      return new OrderStatusResponse(orderId, cachedStatus);
    }

    const order = await this.orderRepository.findOneByOrFail({
      id: orderId,
      userId,
    });

    if (!order) {
      throw new BadRequestException('주문 정보를 찾을 수 없습니다.');
    }

    await this.cacheService.setCache('order', order.id, order.status);
    return new OrderStatusResponse(orderId, order.status);
  }
}

export default OrderService;
