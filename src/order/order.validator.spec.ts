import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderValidator } from '@/order/order.validator';
import { Product } from '@/products/entities/product.entity';

describe('OrderValidator', () => {
  let sut: OrderValidator;
  let productRepository: jest.Mocked<Repository<Product>>;

  const mockProduct: Product = {
    id: 1,
    name: '상품',
    price: 12000,
    salePrice: 10000,
    createAt: new Date(),
    updateAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository: Partial<Repository<Product>> = {
      findOneBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderValidator,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
      ],
    }).compile();

    sut = module.get<OrderValidator>(OrderValidator);
    productRepository = module.get(getRepositoryToken(Product)) as jest.Mocked<
      Repository<Product>
    >;
  });

  afterEach(() => jest.clearAllMocks());

  describe('validation', () => {
    it('should throw error if product is null or empty', async () => {
      productRepository.findOneBy.mockResolvedValue(null);

      await expect(sut.isValid(1, 10000)).rejects.toThrow(
        '상품을 찾을 수 없습니다.',
      );
    });

    it('should throw error product salePrice not equals', async () => {
      productRepository.findOneBy.mockResolvedValue(mockProduct);

      await expect(sut.isValid(1, 8000)).rejects.toThrow(
        '가격 정보가 변경되었습니다. 다시 시도해주세요.',
      );
    });

    it('should success', async () => {
      productRepository.findOneBy.mockResolvedValue(mockProduct);

      await expect(sut.isValid(1, 10000)).resolves.toBe(true);
    });
  });
});
