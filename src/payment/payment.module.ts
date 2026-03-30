import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Payment } from './entities/payment.entity';
import { PaymentProcessor } from './payment.processor';
import { PaymentReader } from './payment.reader';
import { PaymentEventPublisher } from './payment-event.publisher';
import { RedisModule } from '../common/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    RedisModule,
    BullModule.registerQueue({
      name: 'points-queue',
    }),
    BullModule.registerQueue({
      name: 'notifications-queue',
    }),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentProcessor,
    PaymentReader,
    PaymentEventPublisher,
  ],
  exports: [PaymentProcessor, PaymentReader, PaymentEventPublisher],
})
export class PaymentModule {}
