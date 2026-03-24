import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentReader {
  constructor(private readonly paymentRepository: Repository<Payment>) {}
}
