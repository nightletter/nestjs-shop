import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { randomUUID } from 'crypto';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  orderNumber: string;

  @Column({ type: 'int', nullable: false, unsigned: true })
  userId: number;

  @Column({ type: 'int', nullable: false, unsigned: true })
  productId: number;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'int', default: 0, unsigned: true })
  totalAmount: number;

  @Column({ type: 'int', default: 0, unsigned: true })
  balanceAmount: number;

  @Column({ type: 'int', default: 0, unsigned: true })
  pointsUsed: number;

  @CreateDateColumn()
  createAt: Date;

  static create(userId: number, productId: number, pointsUsed?: number): Order {
    const order = new Order();
    order.orderNumber = randomUUID();
    order.userId = userId;
    order.productId = productId;
    order.pointsUsed = pointsUsed ?? 0;
    order.status = 'CREATED';
    return order;
  }

  execute(amount: number) {
    this.status = 'IN_PROGRESS';
    this.totalAmount = amount;
    this.balanceAmount = amount - this.pointsUsed;
  }

  confirm() {
    this.status = 'COMPLETED';
  }

  failure() {
    this.status = 'FAILED';
  }
}
