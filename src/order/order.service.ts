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
import { OrderValidator } from './order.validator';
import { PaymentReader } from '../payment/payment.reader';
import { find } from 'rxjs';

@Injectable()
class OrderService {
  constructor(
    private readonly tossPaymentClient: TossPaymentClient,
    private readonly paymentProcessor: PaymentProcessor,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly orderValidator: OrderValidator,
    private readonly paymentReader: PaymentReader,
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

      const confirmResult: TossPaymentConfirmResponseDto =
        await this.tossPaymentClient.confirm(param);

      fetchOrder.confirm();

      const fetchPayment = await this.paymentReader.getByOrderId(fetchOrder.id);
      if (fetchPayment) {
        fetchPayment.success(confirmResult);
      }
    }
  }
}

export default OrderService;
