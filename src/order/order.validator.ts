import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

    if (!findProduct) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    if (findProduct.salePrice !== salePrice) {
      throw new BadRequestException('가격 정보가 변경되었습니다. 다시 시도해주세요.');
    }
  }
}
