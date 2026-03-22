import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { ProductCategory } from './entities/product-category.entity';
import { ProductOption, ProductSize } from './entities/product-option.entity';
import { ProductsDto } from './dto/products.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoryRepository: Repository<ProductCategory>,
    @InjectRepository(ProductOption)
    private readonly productOptionRepository: Repository<ProductOption>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
  ) {}

  async findAll(category?: string): Promise<ProductsDto[]> {
    if (!category) {
      const fetchProducts = await this.productRepository.find({
        relations: {
          category: true,
          options: true,
        },
        order: { id: 'ASC' },
      });

      return fetchProducts.map((product) => {
        const dto = new ProductsDto();

        // 엔티티 구조에 맞춰서 필드를 매핑하세요.
        dto.categoryCode = product.category?.code;
        dto.categoryName = product.category?.name;
        dto.name = product.name;
        dto.price = product.price;
        dto.salePrice = product.salePrice;

        return dto;
      });
    }

    const categoryEntity = await this.categoryRepository.findOne({
      where: { code: category },
    });

    if (!categoryEntity) {
      throw new BadRequestException('invalid category');
    }

    const fetchProducts = await this.productRepository.find({
      where: { categoryId: categoryEntity.id },
      relations: {
        category: true,
        options: true,
      },
      order: { id: 'ASC' },
    });

    return fetchProducts.map((product) => {
      const dto = new ProductsDto();

      // 엔티티 구조에 맞춰서 필드를 매핑하세요.
      dto.categoryCode = product.category?.code;
      dto.categoryName = product.category?.name;
      dto.name = product.name;
      dto.price = product.price;
      dto.salePrice = product.salePrice;

      return dto;
    });
  }

  async findOne(productId: number) {
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new BadRequestException('valid product id is required');
    }

    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: {
        category: true,
        options: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    return product;
  }

  async addToCart(
    userId: number,
    productId: number,
    size: string,
    quantity = 1,
  ) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('valid user id is required');
    }

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new BadRequestException('valid product id is required');
    }

    if (!this.isValidSize(size)) {
      throw new BadRequestException(
        `size must be one of: ${Object.values(ProductSize).join(', ')}`,
      );
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('quantity must be a positive integer');
    }

    const option = await this.productOptionRepository.findOne({
      where: {
        productId,
        size,
      },
    });

    if (!option) {
      throw new BadRequestException('selected size is not available');
    }

    if (quantity > option.stock) {
      throw new BadRequestException('requested quantity exceeds stock');
    }

    const existingItem = await this.cartItemRepository.findOne({
      where: {
        userId,
        productOptionId: option.id,
      },
    });

    if (existingItem) {
      if (existingItem.quantity + quantity > option.stock) {
        throw new BadRequestException('requested quantity exceeds stock');
      }
      existingItem.quantity += quantity;
      return this.cartItemRepository.save(existingItem);
    }

    const cartItem = this.cartItemRepository.create({
      userId,
      productOptionId: option.id,
      quantity,
    });

    return this.cartItemRepository.save(cartItem);
  }

  private isValidSize(size: string): size is ProductSize {
    return (Object.values(ProductSize) as string[]).includes(size);
  }
}
