import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { ProductOption, ProductSize } from './entities/product-option.entity';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let categoryRepository: {
    findOne: jest.Mock;
  };
  let productOptionRepository: {
    findOne: jest.Mock;
  };
  let cartItemRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    const productRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    const categoryRepositoryMock = {
      findOne: jest.fn(),
    };
    const productOptionRepositoryMock = {
      findOne: jest.fn(),
    };
    const cartItemRepositoryMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: productRepositoryMock,
        },
        {
          provide: getRepositoryToken(ProductCategory),
          useValue: categoryRepositoryMock,
        },
        {
          provide: getRepositoryToken(ProductOption),
          useValue: productOptionRepositoryMock,
        },
        {
          provide: getRepositoryToken(CartItem),
          useValue: cartItemRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get(getRepositoryToken(Product));
    categoryRepository = module.get(getRepositoryToken(ProductCategory));
    productOptionRepository = module.get(getRepositoryToken(ProductOption));
    cartItemRepository = module.get(getRepositoryToken(CartItem));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('filters products by category', async () => {
    categoryRepository.findOne.mockResolvedValue({ id: 1, code: 'outer' });
    productRepository.find.mockResolvedValue([]);

    await service.findAll('outer');

    expect(productRepository.find).toHaveBeenCalledWith({
      where: { categoryId: 1 },
      relations: { category: true, options: true },
      order: { id: 'ASC' },
    });
  });

  it('throws when category is invalid', async () => {
    categoryRepository.findOne.mockResolvedValue(null);

    await expect(service.findAll('invalid')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when product does not exist', async () => {
    productRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('adds a new cart item', async () => {
    productOptionRepository.findOne.mockResolvedValue({
      id: 1,
      stock: 10,
    });
    cartItemRepository.findOne.mockResolvedValue(null);
    cartItemRepository.create.mockReturnValue({
      userId: 1,
      productOptionId: 1,
      quantity: 2,
    });
    cartItemRepository.save.mockResolvedValue({
      id: 1,
      userId: 1,
      productOptionId: 1,
      quantity: 2,
    });

    const result = await service.addToCart(1, 1, ProductSize.M, 2);

    expect(result.quantity).toBe(2);
    expect(cartItemRepository.create).toHaveBeenCalledWith({
      userId: 1,
      productOptionId: 1,
      quantity: 2,
    });
  });

  it('increases quantity when cart item already exists', async () => {
    const existingItem = {
      id: 5,
      userId: 1,
      productOptionId: 1,
      quantity: 1,
    };

    productOptionRepository.findOne.mockResolvedValue({
      id: 1,
      stock: 10,
    });
    cartItemRepository.findOne.mockResolvedValue(existingItem);
    cartItemRepository.save.mockResolvedValue({
      ...existingItem,
      quantity: 4,
    });

    const result = await service.addToCart(1, 1, ProductSize.M, 3);

    expect(result.quantity).toBe(4);
    expect(cartItemRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 4 }),
    );
  });

  it('throws when requested quantity exceeds stock', async () => {
    productOptionRepository.findOne.mockResolvedValue({
      id: 1,
      stock: 2,
    });
    cartItemRepository.findOne.mockResolvedValue(null);

    await expect(
      service.addToCart(1, 1, ProductSize.M, 3),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
