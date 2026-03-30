import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int', nullable: false, unsigned: true })
  userId: number;

  @Column({ type: 'varchar', length: 500, nullable: false })
  message: string;

  @Column({ type: 'varchar', length: 50, nullable: false, default: 'PAYMENT' })
  type: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  isRead: boolean;

  @Column({ type: 'int', nullable: true, unsigned: true })
  orderId: number;

  @CreateDateColumn()
  createdAt: Date;

  static create(
    userId: number,
    message: string,
    type: string = 'PAYMENT',
    orderId?: number,
  ): Notification {
    const notification = new Notification();
    notification.userId = userId;
    notification.message = message;
    notification.type = type;
    notification.isRead = false;
    if (orderId !== undefined) notification.orderId = orderId;
    return notification;
  }
}
