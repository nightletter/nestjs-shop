# Shop E-commerce Backend Specification

## Overview

NestJS 기반 의류 쇼핑몰 백엔드. JWT 인증, Redis Streams 비동기 처리, Toss 결제 연동.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js + pnpm |
| Framework | NestJS |
| Database | MySQL + TypeORM |
| Cache/Queue | Redis, BullMQ, Redis Streams |
| Auth | JWT (passport-jwt) |
| Payment | Toss Payments |
| View | Handlebars (HBS) |

---

## Features

### 1. Authentication
- [x] JWT 기반 로그인/로그아웃
- [x] 회원가입 (ID, 비밀번호)

### 2. Products
- [x] 카테고리별 상품 목록 (아우터, 상의, 하의)
- [x] 상품 상세 조회
- [x] 사이즈 옵션 (S, M, L, XL, XXL)
- [x] 상품 정보 (소재, 원산지, 세탁방법)
- [x] 판매가격, 세일가격
- [x] 장바구니 담기

### 3. Cart
- [x] 장바구니 조회
- [x] 수량 변경
- [x] 삭제

### 4. Order & Payment
- [x] 주문 생성 (`POST /api/order`)
- [x] Toss 결제 연동 (`TossPaymentClient.confirm()`)
- [x] 결제 완료 처리 (`POST /api/order/confirm`)

### 5. Points (Redis Streams)
- [x] 결제 완료 시 10% 포인트 적립
- [x] Redis Streams Consumer로 비동기 처리
- [x] Points 테이블 저장

### 6. Notifications (Redis Streams)
- [ ] 결제 완료 알림 생성
- [ ] Redis Streams Consumer로 비동기 처리
- [ ] Notifications 테이블 저장

---

## Data Models

```
User: id, username, password, createdAt
Product: id, name, category, price, salePrice, sizes, material, origin, care
Order: id, userId, items[], totalAmount, status, createdAt
Payment: id, orderId, amount, method, status, tossPaymentKey
Point: id, userId, amount, reason, createdAt
Notification: id, userId, message, read, createdAt
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | 로그인 |
| POST | /auth/signup | 회원가입 |
| GET | /products | 상품 목록 |
| GET | /products/:id | 상품 상세 |
| GET | /cart | 장바구니 조회 |
| POST | /cart | 장바구니 추가 |
| PATCH | /cart/:id | 수량 변경 |
| DELETE | /cart/:id | 삭제 |
| POST | /orders | 주문 생성 |
| POST | /payments/confirm | 결제 승인 |

---

## Architecture Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   NestJS    │────▶│    MySQL    │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │    Redis    │
                    │   Streams   │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       ┌─────────────┐          ┌─────────────┐
       │   Points    │          │   Notify    │
       │  Consumer   │          │  Consumer   │
       └─────────────┘          └─────────────┘
```

---

## Progress

- **Done**: Auth, Products, Cart, Order, Payment, **Points**
- **In Progress**: -
- **Pending**: Notifications (Redis Streams 기반 Consumer)