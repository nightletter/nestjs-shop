import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class OrderValidator {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async isValid(productId: number, salePrice: number) {
    const findProduct = await this.productRepository.findOneBy({
      id: productId,
    });

    return findProduct?.salePrice === salePrice;
  }
}
