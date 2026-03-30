import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { DatabaseModule } from './common/database/database.module';
import { ProductsModule } from './products/products.module';
import { AppListener } from './app.listener';
import { RedisModule } from './common/redis/redis.module';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
import { PointsModule } from './points/points.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(process.cwd(), '.env'),
      load: [configuration],
    }),
    DatabaseModule,
    ProductsModule,
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
    RedisModule,
    OrderModule,
    PaymentModule,
    PointsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppListener],
})
export class AppModule {}
