import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItem } from './entities/cart-item.entity';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { ProductOption } from '../products/entities/product-option.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([CartItem, ProductOption]), AuthModule],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
