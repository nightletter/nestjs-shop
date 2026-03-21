import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CartItem } from '../cart/entities/cart-item.entity';
import { AuthModule } from '../auth/auth.module';
import { ProductCategory } from './entities/product-category.entity';
import { ProductOption } from './entities/product-option.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductCategory,
      ProductOption,
      CartItem,
    ]),
    AuthModule,
  ],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
