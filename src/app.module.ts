import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './common/database/database.module';
import { join } from 'path';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppListener } from './app.listener';
import { RedisModule } from './common/redis/redis.module';

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
    CartModule,
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppListener],
})
export class AppModule {}
