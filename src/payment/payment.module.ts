import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Payment } from './entities/payment.entity';
import { PaymentProcessor } from './payment.processor';
import { PaymentReader } from './payment.reader';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentProcessor, PaymentReader],
  exports: [PaymentProcessor, PaymentReader],
})
export class PaymentModule {}
