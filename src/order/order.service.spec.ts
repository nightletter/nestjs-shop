import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import OrderService from './order.service';
import { TossPaymentClient } from './toss-payment.client';
import { Order } from './entities/order.entity';
import { OrderEventPublisher } from './order-event-publisher.service';
import CacheService from '@/common/redis/cache.service';
import OrderTransactionService from './order-transaction.service';
import { CreateOrderRequest } from './dto/create-order.request';

describe('OrderService', () => {
  let service: OrderService;
  let orderTransactionService: jest.Mocked<OrderTransactionService>;
  let cacheService: jest.Mocked<CacheService>;

  const mockOrder = {
    id: 1,
    orderNumber: 'test-uuid',
    userId: 1,
    productId: 1,
    status: 'CREATED',
    totalAmount: 10000,
    balanceAmount: 10000,
    pointsUsed: 0,
  } as Order;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: TossPaymentClient,
          useValue: { confirm: jest.fn() },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: {
            findOneByOrFail: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: OrderEventPublisher,
          useValue: { publishOrderComplete: jest.fn() },
        },
        {
          provide: CacheService,
          useValue: {
            setCache: jest.fn(),
            getCache: jest.fn(),
          },
        },
        {
          provide: OrderTransactionService,
          useValue: {
            createWithPayment: jest.fn(),
            execute: jest.fn(),
            confirmWithPayment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderTransactionService = module.get(OrderTransactionService);
    cacheService = module.get(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an order and cache status', async () => {
      const request: CreateOrderRequest = {
        productId: 1,
        salePrice: 10000,
        useAllPoints: false,
      };

      orderTransactionService.createWithPayment.mockResolvedValue(mockOrder);

      const result = await service.create(1, request);

      expect(orderTransactionService.createWithPayment).toHaveBeenCalledWith(
        1,
        request,
      );
      expect(cacheService.setCache).toHaveBeenCalledWith(
        'order',
        mockOrder.id,
        mockOrder.status,
      );
      expect(result).toBeDefined();
    });
  });

  describe('getOrderStatus', () => {
    it('should return cached status if available', async () => {
      cacheService.getCache.mockResolvedValue('COMPLETED');

      const result = await service.getOrderStatus(1, 1);

      expect(result.status).toBe('COMPLETED');
      expect(cacheService.getCache).toHaveBeenCalledWith('order', 1);
    });
  });
});
