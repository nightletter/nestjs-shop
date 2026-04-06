# BullMQ Queue Pattern

이 프로젝트에서 BullMQ를 사용한 비동기 작업 처리 패턴.

## 구조

```
src/
├── common/constants/
│   └── queue-events.constants.ts   # Queue/Event 이름 상수
├── order/
│   └── order-event-publisher.service.ts  # Queue에 Job 추가
├── points/
│   └── points.consumer.ts          # BullMQ Worker
└── notifications/
    └── notifications.consumer.ts   # BullMQ Worker
```

## Queue 이름 상수

```typescript
// src/common/constants/queue-events.constants.ts
export const QueueNames = {
  POINTS: 'points-queue',
  NOTIFICATIONS: 'notifications-queue',
} as const;

export const QueueEvents = {
  ORDER_SUCCESS: 'order.success',
  ORDER_FAILURE: 'order.failure',
} as const;
```

## Publisher (Job 추가)

```typescript
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNames, QueueEvents } from '@/common/constants/queue-events.constants';

@Injectable()
export class OrderEventPublisher {
  constructor(
    @InjectQueue(QueueNames.POINTS)
    private readonly pointsQueue: Queue<OrderCompleteEvent>,
    @InjectQueue(QueueNames.NOTIFICATIONS)
    private readonly notificationsQueue: Queue<OrderCompleteEvent>,
  ) {}

  async publishOrderComplete(order: Order): Promise<void> {
    const payload = {
      orderId: order.id,
      userId: order.userId,
      amount: order.totalAmount,
    };

    await this.pointsQueue.add(QueueEvents.ORDER_SUCCESS, payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }
}
```

## Consumer (Worker)

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QueueNames, QueueEvents } from '@/common/constants/queue-events.constants';

@Processor(QueueNames.POINTS)
@Injectable()
export class PointsConsumer extends WorkerHost {
  async process(job: Job<OrderCompleteEvent>): Promise<void> {
    if (job.name !== QueueEvents.ORDER_SUCCESS) {
      return;
    }

    // 비즈니스 로직 처리
    await this.pointsService.addPoints(job.data.userId, job.data.amount);
  }
}
```

## Module 등록

```typescript
// app.module.ts 또는 해당 feature module
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue(
      { name: QueueNames.POINTS },
      { name: QueueNames.NOTIFICATIONS },
    ),
  ],
})
```

## Job Options

```typescript
await queue.add(eventName, payload, {
  removeOnComplete: 100,  // 완료된 job 100개만 유지
  removeOnFail: 100,      // 실패한 job 100개만 유지
  attempts: 3,            // 재시도 횟수
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
});
```

## Flow

```
Order Complete
     │
     ▼
┌─────────────────┐
│ EventPublisher  │
│ (Queue.add())   │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│Points │ │Notify │
│Queue  │ │Queue  │
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Worker │ │Worker │
└───────┘ └───────┘
```
