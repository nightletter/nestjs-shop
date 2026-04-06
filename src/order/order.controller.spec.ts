import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { OrderController } from './order.controller';
import OrderService from './order.service';
import { CreateOrderRequest } from './dto/create-order.request';
import { SuccessOrderDto } from './dto/success-order.dto';
import { JwtGuard } from '@/auth/guards/jwt.guard';

describe('OrderController', () => {
  let controller: OrderController;
  let orderService: jest.Mocked<OrderService>;

  const mockJwtGuard = {
    canActivate: (context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.user = { id: 1, loginId: 'test' };
      return true;
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: {
            create: jest.fn(),
            confirm: jest.fn(),
            getOrderStatus: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue(mockJwtGuard)
      .compile();

    controller = module.get<OrderController>(OrderController);
    orderService = module.get(OrderService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an order', async () => {
      const user = { id: 1 };
      const request: CreateOrderRequest = {
        productId: 1,
        salePrice: 10000,
        useAllPoints: false,
      };
      const expectedResult = { id: 1, orderNumber: 'test-uuid' };

      orderService.create.mockResolvedValue(expectedResult as any);

      const result = await controller.create(user, request);

      expect(orderService.create).toHaveBeenCalledWith(1, request);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('confirm', () => {
    it('should confirm payment', async () => {
      const param: SuccessOrderDto = {
        paymentType: 'CARD',
        orderId: 'test-order-id',
        paymentKey: 'test-payment-key',
        amount: 10000,
      };

      orderService.confirm.mockResolvedValue(undefined);

      await controller.findAll(param);

      expect(orderService.confirm).toHaveBeenCalledWith(param);
    });
  });

  describe('getOrder', () => {
    it('should return order status', async () => {
      const user = { id: 1 };
      const expectedResult = { orderId: 1, status: 'COMPLETED' };

      orderService.getOrderStatus.mockResolvedValue(expectedResult as any);

      const result = await controller.getOrder(user, '1');

      expect(orderService.getOrderStatus).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(expectedResult);
    });
  });
});
