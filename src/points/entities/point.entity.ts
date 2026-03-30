import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('points')
export class Point {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int', nullable: false, unsigned: true })
  userId: number;

  @Column({ type: 'int', nullable: false, unsigned: true })
  amount: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  reason: string;

  @Column({ type: 'int', nullable: true, unsigned: true })
  orderId: number;

  @Column({ type: 'int', nullable: true, unsigned: true })
  paymentId: number;

  @CreateDateColumn()
  createdAt: Date;

  static create(
    userId: number,
    amount: number,
    reason: string,
    orderId?: number,
    paymentId?: number,
  ): Point {
    const point = new Point();
    point.userId = userId;
    point.amount = amount;
    point.reason = reason;
    if (orderId !== undefined) point.orderId = orderId;
    if (paymentId !== undefined) point.paymentId = paymentId;
    return point;
  }
}
