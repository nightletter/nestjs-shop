# Clean Architecture & Clean Code Guide

이 프로젝트의 클린 아키텍처 및 클린 코드 상세 가이드.

---

## 📐 Clean Architecture Layers

### 1. Presentation Layer (Controller)
**책임**: HTTP 요청/응답 처리, 인증/인가, DTO 변환

```typescript
@Controller('api/order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtGuard)  // 인증
  @Post()
  async create(
    @CurrentUser() user: { id: number },  // 사용자 추출
    @Body() request: CreateOrderRequest,   // DTO 검증
  ) {
    return this.orderService.create(user.id, request);
  }
}
```

**규칙:**
- 비즈니스 로직 금지 → Service로 위임
- DTO로 입출력 타입 명시
- HTTP 상태 코드, 에러 처리

---

### 2. Application Layer (Service)
**책임**: 비즈니스 플로우 조율, 트랜잭션 경계

```typescript
@Injectable()
class OrderService {
  constructor(
    private readonly orderTransactionService: OrderTransactionService,
    private readonly cacheService: CacheService,
    private readonly eventPublisher: OrderEventPublisher,
  ) {}

  async create(userId: number, request: CreateOrderRequest) {
    // 트랜잭션 서비스 호출
    const order = await this.orderTransactionService.createWithPayment(
      userId,
      request,
    );

    // 캐시 업데이트
    await this.cacheService.setCache('order', order.id, order.status);

    // 이벤트 발행
    return plainToInstance(CreatedOrderResponse, order);
  }
}
```

**규칙:**
- 여러 도메인 서비스 조율
- 트랜잭션은 TransactionService로 분리
- 외부 시스템 연동 (Cache, Queue, Event)

---

### 3. Domain Layer (Entity, Validator, Processor)

#### Entity - 도메인 로직 보유
```typescript
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  // 팩토리 메서드
  static create(userId: number, productId: number): Order {
    const order = new Order();
    order.userId = userId;
    order.productId = productId;
    order.status = 'CREATED';
    return order;
  }

  // 상태 변경 메서드
  execute(amount: number) {
    this.status = 'IN_PROGRESS';
    this.totalAmount = amount;
  }

  confirm() {
    this.status = 'COMPLETED';
  }
}
```

#### Validator - 도메인 규칙 검증
```typescript
@Injectable()
export class OrderValidator {
  async isValid(productId: number, salePrice: number) {
    const product = await this.productRepository.findOneBy({ id: productId });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    if (product.salePrice !== salePrice) {
      throw new BadRequestException('가격 정보가 변경되었습니다.');
    }
  }
}
```

#### Processor - 엔티티 CRUD 처리
```typescript
@Injectable()
export class OrderProcessor {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(userId: number, productId: number): Promise<Order> {
    return this.orderRepository.save(Order.create(userId, productId));
  }
}
```

**규칙:**
- Entity는 생성자 대신 팩토리 메서드 사용
- 상태 변경은 Entity 메서드로만 (setter 금지)
- Validator는 도메인 규칙만 검증
- Processor는 순수 CRUD만 (비즈니스 로직 금지)

---

### 4. Infrastructure Layer (Repository, Client)

```typescript
// TypeORM Repository 주입
@InjectRepository(Order)
private readonly orderRepository: Repository<Order>

// 외부 API 클라이언트
@Injectable()
export class TossPaymentClient {
  async confirm(param: SuccessOrderDto) {
    return this.httpService.post('https://api.tosspayments.com/...');
  }
}
```

---

## 📝 Clean Code Principles

### 1. 명확한 네이밍

**❌ Bad:**
```typescript
async proc(u: number, r: CreateOrderRequest) {
  const o = await this.svc.create(u, r);
  return o;
}
```

**✅ Good:**
```typescript
async create(userId: number, request: CreateOrderRequest) {
  const order = await this.orderTransactionService.createWithPayment(
    userId,
    request,
  );
  return order;
}
```

---

### 2. 함수는 한 가지 일만

**❌ Bad:**
```typescript
async createOrderAndSendEmail(userId: number, request: CreateOrderRequest) {
  const order = await this.orderRepository.save(Order.create(...));
  const payment = await this.paymentRepository.save(Payment.create(...));
  await this.emailService.send(userId, 'Order created');
  return order;
}
```

**✅ Good:**
```typescript
@Transactional()
async createWithPayment(userId: number, request: CreateOrderRequest) {
  const order = await this.orderProcessor.create(userId, request.productId);
  await this.paymentProcessor.create(order.id, userId);
  return order;
}

// 이메일은 이벤트로 분리
await this.eventPublisher.publishOrderComplete(order);
```

---

### 3. Early Return (Guard Clause)

**❌ Bad:**
```typescript
async isValid(productId: number, salePrice: number) {
  const product = await this.productRepository.findOneBy({ id: productId });
  
  if (product) {
    if (product.salePrice === salePrice) {
      return true;
    } else {
      throw new Error('가격 불일치');
    }
  } else {
    throw new Error('상품 없음');
  }
}
```

**✅ Good:**
```typescript
async isValid(productId: number, salePrice: number) {
  const product = await this.productRepository.findOneBy({ id: productId });

  if (!product) {
    throw new NotFoundException('상품을 찾을 수 없습니다.');
  }

  if (product.salePrice !== salePrice) {
    throw new BadRequestException('가격 정보가 변경되었습니다.');
  }
}
```

---

### 4. 매직 넘버/문자열 금지

**❌ Bad:**
```typescript
if (order.status === 'COMPLETED') {
  await this.queue.add('order.success', { orderId: order.id });
}
```

**✅ Good:**
```typescript
// constants/queue-events.constants.ts
export const QueueEvents = {
  ORDER_SUCCESS: 'order.success',
} as const;

export const OrderStatus = {
  CREATED: 'CREATED',
  COMPLETED: 'COMPLETED',
} as const;

// 사용
if (order.status === OrderStatus.COMPLETED) {
  await this.queue.add(QueueEvents.ORDER_SUCCESS, { orderId: order.id });
}
```

---

### 5. 의미 있는 에러 메시지

**❌ Bad:**
```typescript
throw new Error('Invalid');
throw new BadRequestException('에러');
```

**✅ Good:**
```typescript
throw new NotFoundException('상품을 찾을 수 없습니다.');
throw new BadRequestException('가격 정보가 변경되었습니다. 다시 시도해주세요.');
```

---

## 🧪 Testing Principles

### 1. AAA 패턴 (Arrange-Act-Assert)

```typescript
describe('OrderService', () => {
  describe('create', () => {
    it('should create an order and cache status', async () => {
      // Arrange
      const request: CreateOrderRequest = {
        productId: 1,
        salePrice: 10000,
        useAllPoints: false,
      };
      orderTransactionService.createWithPayment.mockResolvedValue(mockOrder);

      // Act
      const result = await service.create(1, request);

      // Assert
      expect(orderTransactionService.createWithPayment).toHaveBeenCalledWith(1, request);
      expect(cacheService.setCache).toHaveBeenCalledWith('order', mockOrder.id, mockOrder.status);
      expect(result).toBeDefined();
    });
  });
});
```

### 2. 의존성 Mock

```typescript
const module: TestingModule = await Test.createTestingModule({
  providers: [
    OrderService,
    {
      provide: OrderTransactionService,
      useValue: {
        createWithPayment: jest.fn(),
      },
    },
  ],
}).compile();
```

---

## 📦 트랜잭션 처리

```typescript
@Injectable()
class OrderTransactionService {
  @Transactional()  // typeorm-transactional
  async confirmWithPayment(param: TossPaymentConfirmResponseDto) {
    const order = await this.orderRepository.findOneByOrFail({
      orderNumber: param.orderId,
    });

    order.confirm();
    await this.orderProcessor.save(order);

    const payment = await this.paymentRepository.findOneByOrFail({
      orderId: order.id,
    });

    payment.success(param);
    await this.paymentRepository.save(payment);

    return order;
  }
}
```

**규칙:**
- `@Transactional()` 데코레이터 사용
- Service에서 직접 사용 금지 → TransactionService로 분리
- 읽기 전용은 트랜잭션 불필요
