import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductOption } from '../products/entities/product-option.entity';
import { CartItem } from './entities/cart-item.entity';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;
  let cartItemRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let productOptionRepository: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getRepositoryToken(CartItem),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProductOption),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartItemRepository = module.get(getRepositoryToken(CartItem));
    productOptionRepository = module.get(getRepositoryToken(ProductOption));
  });

  it('returns cart item list by user', async () => {
    cartItemRepository.find.mockResolvedValue([
      { id: 1, userId: 1, productOptionId: 2, quantity: 1 },
    ]);

    const result = await service.findAll(1);

    expect(result).toHaveLength(1);
    expect(cartItemRepository.find).toHaveBeenCalledWith({
      where: { userId: 1 },
      order: { id: 'ASC' },
    });
  });

  it('updates cart item quantity', async () => {
    cartItemRepository.findOne.mockResolvedValue({
      id: 1,
      userId: 1,
      productOptionId: 2,
      quantity: 1,
    });
    productOptionRepository.findOne.mockResolvedValue({
      id: 2,
      stock: 5,
    });
    cartItemRepository.save.mockResolvedValue({
      id: 1,
      userId: 1,
      productOptionId: 2,
      quantity: 3,
    });

    const result = await service.updateQuantity(1, 1, 3);

    expect(result.quantity).toBe(3);
  });

  it('throws when quantity exceeds stock', async () => {
    cartItemRepository.findOne.mockResolvedValue({
      id: 1,
      userId: 1,
      productOptionId: 2,
      quantity: 1,
    });
    productOptionRepository.findOne.mockResolvedValue({
      id: 2,
      stock: 2,
    });

    await expect(service.updateQuantity(1, 1, 3)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when cart item not found', async () => {
    cartItemRepository.findOne.mockResolvedValue(null);

    await expect(service.updateQuantity(1, 999, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes cart item', async () => {
    cartItemRepository.findOne.mockResolvedValue({
      id: 1,
      userId: 1,
      productOptionId: 2,
      quantity: 1,
    });
    cartItemRepository.remove.mockResolvedValue(undefined);

    const result = await service.remove(1, 1);

    expect(result).toEqual({
      id: 1,
      message: 'Cart item deleted successfully',
    });
  });
});
