import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { TossPaymentClient } from './toss-payment.client';
import { SuccessOrderDto } from './dto/success-order.dto';
import { TossPaymentConfirmResponseDto } from './dto/toss-payment-confirm-response.dto';

describe('TossPaymentClient', () => {
  let client: TossPaymentClient;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const mockSuccessOrderDto: SuccessOrderDto = {
    paymentType: 'CARD',
    orderId: 'order-123',
    paymentKey: 'pay-key-123',
    amount: 50000,
  };

  const mockTossResponse = {
    mId: 'toss-merchant-id',
    lastTransactionKey: 'last-trans-key',
    paymentKey: 'pay-key-123',
    orderId: 'order-123',
    orderName: 'Test Order',
    taxExemptionAmount: 0,
    status: 'DONE',
    requestedAt: '2024-04-16T11:00:00Z',
    approvedAt: '2024-04-16T11:00:01Z',
    useEscrow: false,
    cultureExpense: false,
    card: null,
    virtualAccount: null,
    transfer: null,
    mobilePhone: null,
    giftCertificate: null,
    cashReceipt: null,
    cashReceipts: null,
    discount: null,
    cancels: null,
    secret: null,
    type: 'NORMAL',
    easyPay: null,
    country: 'KR',
    failure: null,
    isPartialCancelable: false,
    receipt: null,
    checkout: null,
    currency: 'KRW',
    totalAmount: 50000,
    balanceAmount: 50000,
    suppliedAmount: 50000,
    vat: 0,
    taxFreeAmount: 0,
    metadata: null,
    method: 'CARD',
    version: '2022-11-16',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TossPaymentClient,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    client = module.get<TossPaymentClient>(TossPaymentClient);
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('confirm', () => {
    it('should confirm payment and return response', async () => {
      configService.get.mockReturnValue('test-api-key');
      httpService.post.mockReturnValue(of({ data: mockTossResponse } as any));

      const result = await client.confirm(mockSuccessOrderDto);

      expect(result).toBeInstanceOf(TossPaymentConfirmResponseDto);
      expect(result.paymentKey).toBe('pay-key-123');
      expect(result.orderId).toBe('order-123');
      expect(result.status).toBe('DONE');
      expect(result.totalAmount).toBe(50000);
    });

    it('should create correct authorization header', async () => {
      configService.get.mockReturnValue('api-key-123');
      httpService.post.mockReturnValue(of({ data: mockTossResponse } as any));

      await client.confirm(mockSuccessOrderDto);

      const token = Buffer.from('api-key-123:').toString('base64');
      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.tosspayments.com/v1/payments/confirm',
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Basic ${token}`,
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should send correct payment data to API', async () => {
      configService.get.mockReturnValue('api-key');
      httpService.post.mockReturnValue(of({ data: mockTossResponse } as any));

      await client.confirm(mockSuccessOrderDto);

      const sentData = JSON.parse(httpService.post.mock.calls[0][1]);
      expect(sentData).toEqual({
        paymentKey: 'pay-key-123',
        orderId: 'order-123',
        amount: 50000,
      });
    });

    it('should handle API error and throw custom error message', async () => {
      configService.get.mockReturnValue('api-key');
      const apiError = new Error('Network error');
      httpService.post.mockReturnValue(throwError(() => apiError));

      await expect(client.confirm(mockSuccessOrderDto)).rejects.toThrow(
        '결제 승인처리 중 오류가 발생했습니다.',
      );
    });

    it('should exclude extraneous values from response', async () => {
      configService.get.mockReturnValue('api-key');
      const responseWithExtra = {
        ...mockTossResponse,
        extraField: 'should-be-excluded',
        anotherExtra: 123,
      };
      httpService.post.mockReturnValue(of({ data: responseWithExtra } as any));

      const result = await client.confirm(mockSuccessOrderDto);

      expect((result as any).extraField).toBeUndefined();
      expect((result as any).anotherExtra).toBeUndefined();
    });

    it('should map card information when present', async () => {
      configService.get.mockReturnValue('api-key');
      const responseWithCard = {
        ...mockTossResponse,
        card: {
          issuerCode: 'SHINHAN',
          acquirerCode: 'SHINHAN',
          number: '4111111111111111',
          installmentPlanMonths: 0,
          isInterestFree: true,
          interestPayer: null,
          approveNo: 'approve-123',
          useCardPoint: false,
          cardType: 'CREDIT',
          ownerType: 'PERSONAL',
          acquireStatus: 'APPROVED',
          amount: 50000,
        },
      };
      httpService.post.mockReturnValue(of({ data: responseWithCard } as any));

      const result = await client.confirm(mockSuccessOrderDto);

      expect(result.card).toBeDefined();
      expect(result.card?.approveNo).toBe('approve-123');
      expect(result.card?.number).toBe('4111111111111111');
    });

    it('should handle failure information when present', async () => {
      configService.get.mockReturnValue('api-key');
      const responseWithFailure = {
        ...mockTossResponse,
        status: 'ABORTED',
        failure: {
          code: 'INVALID_AMOUNT',
          message: 'Amount mismatch',
        },
      };
      httpService.post.mockReturnValue(
        of({ data: responseWithFailure } as any),
      );

      const result = await client.confirm(mockSuccessOrderDto);

      expect(result.failure).toBeDefined();
      expect(result.failure?.code).toBe('INVALID_AMOUNT');
      expect(result.failure?.message).toBe('Amount mismatch');
    });

    it('should handle different order amounts', async () => {
      configService.get.mockReturnValue('api-key');
      const testDto = { ...mockSuccessOrderDto, amount: 100000 };
      httpService.post.mockReturnValue(
        of({ data: { ...mockTossResponse, totalAmount: 100000 } } as any),
      );

      const result = await client.confirm(testDto);

      expect(result.totalAmount).toBe(100000);
    });

    it('should handle null card response', async () => {
      configService.get.mockReturnValue('api-key');
      const responseWithNullCard = { ...mockTossResponse, card: null };
      httpService.post.mockReturnValue(
        of({ data: responseWithNullCard } as any),
      );

      const result = await client.confirm(mockSuccessOrderDto);

      expect(result.card).toBeNull();
    });

    it('should get API key from config service', async () => {
      configService.get.mockReturnValue('my-api-key');
      httpService.post.mockReturnValue(of({ data: mockTossResponse } as any));

      await client.confirm(mockSuccessOrderDto);

      expect(configService.get).toHaveBeenCalledWith('toss.payment.apiKey');
    });
  });
});
