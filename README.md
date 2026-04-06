# Shop - E-commerce Backend

NestJS 기반 의류 쇼핑몰 백엔드 API 서버.

## Tech Stack

- **Framework**: NestJS + TypeScript
- **Database**: MySQL + TypeORM
- **Cache/Queue**: Redis, BullMQ, Redis Streams
- **Auth**: JWT (passport-jwt)
- **Payment**: Toss Payments

## Quick Start

```bash
# Install
pnpm install

# Development
pnpm start:dev

# Production
pnpm run build && pnpm start:prod
```

## Scripts

```bash
pnpm test              # Unit tests
pnpm test:e2e          # E2E tests
pnpm run lint          # ESLint
pnpm run format        # Prettier
```

## Project Structure

```
src/
├── auth/           # JWT 인증
├── users/          # 사용자 관리
├── products/       # 상품 카탈로그
├── order/          # 주문 처리
├── payment/        # Toss 결제
├── points/         # 포인트 (Redis Streams)
├── notifications/  # 알림 (Redis Streams)
└── common/         # 공통 모듈
```

## Environment

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=shop
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret
TOSS_PAYMENT_CLIENT_KEY=test_ck_xxx
TOSS_PAYMENT_API_KEY=test_sk_xxx
```

## Documentation

- [SPEC.md](./SPEC.md) - 기능 명세
- [CLAUDE.md](./CLAUDE.md) - AI 코딩 지침
- [openapi.yml](./openapi.yml) - API 스펙
