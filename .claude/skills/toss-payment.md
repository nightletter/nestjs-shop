# Toss Payment Integration

Toss Payments API 연동 가이드.

## 구조

```
src/payment/
├── toss-payment.client.ts   # API Client
├── payment.service.ts       # Business Logic
├── payment.module.ts
└── entities/
    ├── payment.entity.ts
    └── payment-outbox.entity.ts
```

## 환경변수

```env
TOSS_PAYMENT_CLIENT_KEY=test_ck_xxx
TOSS_PAYMENT_API_KEY=test_sk_xxx
```

## Client 구현

```typescript
@Injectable()
export class TossPaymentClient {
  private readonly baseUrl = 'https://api.tosspayments.com/v1';

  async confirmPayment(paymentKey: string, orderId: string, amount: number) {
    const response = await this.httpService.post(
      `${this.baseUrl}/payments/confirm`,
      { paymentKey, orderId, amount },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
        },
      }
    );
    return response.data;
  }
}
```

## 결제 Flow

1. Client → `POST /orders` 주문 생성
2. Client → Toss 위젯으로 결제
3. Toss → Redirect with paymentKey
4. Client → `POST /payments/confirm` 결제 승인
5. Server → Toss API 결제 확정
6. Server → Redis Streams에 이벤트 발행
