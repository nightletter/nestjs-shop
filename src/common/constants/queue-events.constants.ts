/**
 * Queue event name constants
 * Java의 enum처럼 큐 이벤트 이름을 상수로 관리
 */
export const QueueEvents = {
  ORDER_SUCCESS: 'order.success',
  ORDER_FAILURE: 'order.failure',
  POINTS_EARN: 'points.earn',
  POINTS_USE: 'points.use',
} as const;

/**
 * Queue name constants
 */
export const QueueNames = {
  POINTS: 'points-queue',
  NOTIFICATIONS: 'notifications-queue',
} as const;

// Type export for type safety
export type QueueEvent = (typeof QueueEvents)[keyof typeof QueueEvents];
export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];
