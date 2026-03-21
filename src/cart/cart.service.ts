import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { ProductOption } from '../products/entities/product-option.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(ProductOption)
    private readonly productOptionRepository: Repository<ProductOption>,
  ) {}

  async findAll(userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('valid user id is required');
    }

    return this.cartItemRepository.find({
      where: { userId },
      order: { id: 'ASC' },
    });
  }

  async updateQuantity(userId: number, cartItemId: number, quantity: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('valid user id is required');
    }

    if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
      throw new BadRequestException('valid cart item id is required');
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('quantity must be a positive integer');
    }

    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId, userId },
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with id ${cartItemId} not found`);
    }

    const option = await this.productOptionRepository.findOne({
      where: { id: cartItem.productOptionId },
    });

    if (!option) {
      throw new NotFoundException(
        `Product option with id ${cartItem.productOptionId} not found`,
      );
    }

    if (quantity > option.stock) {
      throw new BadRequestException('requested quantity exceeds stock');
    }

    cartItem.quantity = quantity;
    return this.cartItemRepository.save(cartItem);
  }

  async remove(userId: number, cartItemId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('valid user id is required');
    }

    if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
      throw new BadRequestException('valid cart item id is required');
    }

    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId, userId },
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with id ${cartItemId} not found`);
    }

    await this.cartItemRepository.remove(cartItem);

    return {
      id: cartItemId,
      message: 'Cart item deleted successfully',
    };
  }
}
