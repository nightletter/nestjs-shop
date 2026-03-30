import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentProcessor {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async create(orderId: number, userId: number): Promise<Payment> {
    return this.paymentRepository.save(Payment.create(orderId, userId));
  }

  async save(payment: Payment): Promise<Payment> {
    return this.paymentRepository.save(payment);
  }
}
