import { Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderRequest } from '@/order/dto/create-order.request';
import { OrderValidator } from '@/order/order.validator';
import { OrderProcessor } from '@/order/order.processor';
import { PaymentProcessor } from '@/payment/payment.processor';
import { PointsReader } from '@/points/points.reader';
import { Order } from '@/order/entities/order.entity';
import { TossPaymentConfirmResponseDto } from '@/order/dto/toss-payment-confirm-response.dto';
import { Payment } from '@/payment/entities/payment.entity';

@Injectable()
class OrderTransactionService {
  constructor(
    private readonly orderValidator: OrderValidator,
    private readonly orderProcessor: OrderProcessor,
    private readonly paymentProcessor: PaymentProcessor,
    private readonly pointsReader: PointsReader,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  @Transactional()
  async createWithPayment(userId: number, request: CreateOrderRequest) {
    await this.orderValidator.isValid(request.productId, request.salePrice);

    let pointsUsed = 0;
    if (request.useAllPoints) {
      const userBalance = await this.pointsReader.getBalance(userId);
      pointsUsed = Math.min(request.salePrice, userBalance);
    }

    const order = await this.orderProcessor.create(
      userId,
      request.productId,
      request.salePrice,
      pointsUsed,
    );

    await this.paymentProcessor.create(order.id, userId);

    return order;
  }

  @Transactional()
  async execute(orderNumber: string, amount: number) {
    const order = await this.orderRepository.findOneByOrFail({
      orderNumber,
    });

    order.execute(amount);
    return this.orderProcessor.save(order);
  }

  @Transactional()
  async confirmWithPayment(param: TossPaymentConfirmResponseDto) {
    const order = await this.orderRepository.findOneByOrFail({
      orderNumber: param.orderId,
    });

    order.confirm();
    await this.orderProcessor.save(order);
    const payment = await this.paymentRepository.findOneByOrFail({
      orderId: order.id,
    });

    payment.success(param);
    await this.paymentRepository.save(payment);

    return order;
  }
}

export default OrderTransactionService;
