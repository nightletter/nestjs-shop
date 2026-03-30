import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentProcessor } from './payment.processor';
import { PaymentReader } from './payment.reader';
import { RedisModule } from '@/common/redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), RedisModule],
  providers: [PaymentProcessor, PaymentReader],
  exports: [PaymentProcessor, PaymentReader],
})
export class PaymentModule {}
