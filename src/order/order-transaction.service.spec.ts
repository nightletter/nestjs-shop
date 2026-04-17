import { Repository } from 'typeorm';
import OrderTransactionService from '@/order/order-transaction.service';
import { OrderValidator } from '@/order/order.validator';
import { OrderProcessor } from '@/order/order.processor';
import { PaymentProcessor } from '@/payment/payment.processor';
import { PointsReader } from '@/points/points.reader';
import { Order } from '@/order/entities/order.entity';
import { Payment } from '@/payment/entities/payment.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('OrderTransactionService', () => {
  let sut: OrderTransactionService;
  let orderValidator: jest.Mocked<OrderValidator>;
  let orderProcessor: jest.Mocked<OrderProcessor>;
  let paymentProcessor: jest.Mocked<PaymentProcessor>;
  let pointsReader: jest.Mocked<PointsReader>;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let paymentRepository: jest.Mocked<Repository<Payment>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderTransactionService,
        {
          provide: OrderValidator,
          useValue: { isValid: jest.fn() },
        },
        {
          provide: OrderProcessor,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: PaymentProcessor,
          useValue: { create: jest.fn() },
        },
        {
          provide: PointsReader,
          useValue: { getBalance: jest.fn() },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: {
            findOneByOrFail: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: {
            findOneByOrFail: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    sut = module.get<OrderTransactionService>(OrderTransactionService);
    orderValidator = module.get(OrderValidator);
    orderProcessor = module.get(OrderProcessor);
    paymentProcessor = module.get(PaymentProcessor);
    pointsReader = module.get(PointsReader);
    orderRepository = module.get(getRepositoryToken(Order));
    paymentRepository = module.get(getRepositoryToken(Payment));
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
