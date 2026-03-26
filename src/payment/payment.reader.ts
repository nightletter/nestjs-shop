import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PaymentReader {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>
  ) {}

  async getByOrderId(orderId: number): Promise<Payment> {
    const findPayment = await this.paymentRepository.findOneBy({
      orderId: orderId,
    });

    if (!findPayment) {
      throw new Error(`Payment with id ${orderId} not found`);
    }

    return findPayment;
  }
}
