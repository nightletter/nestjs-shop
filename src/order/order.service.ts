import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { SuccessOrderDto } from './dto/success-order.dto';
import { TossPaymentClient } from './toss-payment.client';
import { TossPaymentConfirmResponseDto } from './dto/toss-payment-confirm-response.dto';
import { Order } from './entities/order.entity';
import { CreatedOrderDto } from './dto/created-order.dto';
import { PaymentProcessor } from '@/payment/payment.processor';
import { CreateOrderRequest } from './dto/create-order.request';
import { OrderValidator } from './order.validator';
import { PaymentReader } from '@/payment/payment.reader';
import { PaymentEventPublisher } from '@/payment/payment-event.publisher';
import { Payment } from '@/payment/entities/payment.entity';
import { CacheService } from '@/common/redis/cache.service';
import { OrderStatusResponse } from '@/order/dto/order-status.response';

@Injectable()
class OrderService {
  private readonly ORDER_CACHE_PREFIX = 'order:';

  private readonly ORDER_CACHE_TTL = 1800; // 1시간

  constructor(
    private readonly tossPaymentClient: TossPaymentClient,
    private readonly paymentProcessor: PaymentProcessor,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly orderValidator: OrderValidator,
    private readonly paymentReader: PaymentReader,
    private readonly eventPublisher: PaymentEventPublisher,
    private readonly cacheService: CacheService,
  ) {}

  @Transactional()
  async create(userId: number, request: CreateOrderRequest) {
    const isValid = await this.orderValidator.isValid(
      request.productId,
      request.salePrice,
    );

    if (!isValid) {
      throw new Error('상품 정보가 올바르지 않습니다.');
    }

    const order = await this.orderRepository.save(
      Order.create(userId, request.productId),
    );

    const payment = await this.paymentProcessor.create(order.id, userId);

    // Redis 캐시에 주문 상태 저장
    await this.cacheOrderStatus(order.id, order.status);

    return plainToInstance(CreatedOrderDto, order, {
      excludeExtraneousValues: true,
    });
  }

  @Transactional()
  async confirm(param: SuccessOrderDto) {
    const fetchOrder = await this.orderRepository.findOneBy({
      orderNumber: param.orderId,
    });
    if (fetchOrder) {
      fetchOrder.execute(param.amount);
      const fetchPayment = await this.paymentReader.getByOrderId(fetchOrder.id);

      const confirmResult: TossPaymentConfirmResponseDto =
        await this.tossPaymentClient.confirm(param);

      fetchOrder.confirm();

      // Order 엔티티 변경사항 저장
      await this.orderRepository.save(fetchOrder);

      // Redis 캐시 상태 업데이트 (COMPLETED)
      await this.cacheOrderStatus(fetchOrder.id, fetchOrder.status);

      if (fetchPayment) {
        fetchPayment.success(confirmResult);
        // Payment 엔티티 변경사항 저장
        await this.paymentProcessor.save(fetchPayment);
        await this.emitQueue(fetchOrder, fetchPayment);
      }
    }
  }

  async getOrderById(
    userId: number,
    orderId: number,
  ): Promise<OrderStatusResponse> {
    // Redis 캐시에서 먼저 조회
    const cacheKey = this.getCacheKey(orderId);
    const cachedStatus = await this.cacheService.getCache<string>(cacheKey);

    if (cachedStatus) {
      return new OrderStatusResponse(orderId, cachedStatus);
    }

    const order = await this.orderRepository.findOneBy({
      id: orderId,
      userId,
    });

    if (!order) {
      throw new BadRequestException('주문 정보를 찾을 수 없습니다.');
    }

    await this.cacheOrderStatus(order.id, order.status);
    return new OrderStatusResponse(orderId, order.status);
  }

  private async cacheOrderStatus(
    orderId: number,
    status: string,
  ): Promise<void> {
    const cacheKey = this.getCacheKey(orderId);
    await this.cacheService.setCache(cacheKey, status, this.ORDER_CACHE_TTL);
  }

  private getCacheKey(orderId: number): string {
    return `${this.ORDER_CACHE_PREFIX}${orderId}`;
  }

  private async emitQueue(order: Order, payment: Payment) {
    await this.eventPublisher.publishPaymentSuccess({
      paymentId: payment.id,
      orderId: order.id,
      userId: order.userId,
      paymentKey: payment.paymentKey,
      method: payment.method,
      amount: order.totalAmount,
      approvedAt: new Date(),
    });
  }
}

export default OrderService;
