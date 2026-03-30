import { BullModule } from '@nestjs/bullmq';
import { RedisModule as CacheModule } from '@liaoliaots/nestjs-redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import CacheService from './cache.service';
import { OrderQueuePublisherService } from './order-queue-publisher.service';

@Module({
  imports: [
    CacheModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        config: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
        },
      }),
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
        },
      }),
    }),

    BullModule.registerQueue({
      name: 'order-queue',
    }),

    BullModule.registerQueue({
      name: 'payment-queue',
    }),
  ],
  providers: [CacheService, OrderQueuePublisherService],
  exports: [CacheService, OrderQueuePublisherService],
})
export class RedisModule {}
