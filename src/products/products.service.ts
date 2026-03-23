import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductResponse } from './dto/product.response';
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll() {
    const fetchProducts = await this.productRepository.find({
      take: 1,
    });

    return fetchProducts.map((product) => {
      const result = new ProductResponse();
      result.id = product.id;
      result.name = product.name;
      result.price = product.price;
      result.salePrice = product.salePrice ?? product.price;
      return result;
    });
  }
}
