# Shop - NestJS E-commerce Backend

## Commands

```bash
pnpm install              # Install dependencies
pnpm start:dev            # Dev server (watch mode)
pnpm run build            # Build
pnpm test                 # Unit tests
pnpm test:e2e             # E2E tests
pnpm run lint             # ESLint fix
pnpm run format           # Prettier format
```

## Code Style

- **Services**: `export default class XxxService`
- **DTOs**: `*.request.ts`, `*.response.ts`
- **Events**: `<entity>-<action>.event.ts`
- **Entities**: TypeORM `@Entity()` in `entities/` folder
- **Guards**: Use `@UseGuards(JwtGuard)` for protected routes
- **User extraction**: `@CurrentUser()` decorator
- **Transactions**: `@Transactional()` from `typeorm-transactional`

## Architecture

```
src/
├── auth/           # JWT authentication
├── users/          # User management
├── products/       # Product catalog
├── order/          # Order flow + payment
├── payment/        # Toss payment client
├── points/         # Redis streams 기반 포인트
├── notifications/  # Redis streams 기반 알림
└── common/         # Database, Redis, decorators
```

## Key Patterns

- **DB**: MySQL + TypeORM, `autoLoadEntities: true`
- **Events**: `@nestjs/event-emitter` (wildcard, `.` delimiter)
- **Queues**: BullMQ (`QueueNames.POINTS`, `QueueNames.NOTIFICATIONS`)
- **Validation**: Global `ValidationPipe` (whitelist, transform)

## Clean Architecture Principles

- **계층 분리**: Controller → Service → Transaction/Processor → Repository
- **단일 책임**: Validator, Processor, Publisher 등 역할별 클래스 분리
- **의존성 역전**: Repository 인터페이스 통해 주입, 구현체 분리
- **도메인 중심**: Entity에 비즈니스 로직 (`Order.confirm()`, `Payment.success()`)
- **불변성**: DTO는 readonly, Entity 상태 변경은 메서드로만
- **에러 처리**: NestJS Exception 사용 (`BadRequestException`, `NotFoundException`)

## Clean Code Rules

- **명확한 네이밍**: 축약 금지, 역할이 명확한 이름 사용
- **작은 함수**: 한 함수는 한 가지 일만
- **주석 최소화**: 코드가 자명하게, 필요시만 주석
- **매직 넘버 금지**: 상수로 추출 (`QueueNames`, `QueueEvents`)
- **Early Return**: Guard Clause 패턴 사용
- **테스트 필수**: 모든 Service/Controller는 테스트 작성

## Environment

```env
PORT, DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
REDIS_HOST, REDIS_PORT, JWT_SECRET
TOSS_PAYMENT_CLIENT_KEY, TOSS_PAYMENT_API_KEY
```

## Gotchas

- Dev에서 `dropSchema: true` → 재시작 시 DB 초기화
- `initializeTransactionalContext()` 필수 (main.ts)
- 새 Entity 추가 시 `DatabaseModule.forFeature()` 등록
