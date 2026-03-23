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

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'int', nullable: false, unsigned: true })
  totalAmount: number;

  @Column({ type: 'int', nullable: false, unsigned: true })
  balanceAmount: number;

  @CreateDateColumn()
  createAt: Date;

  static create(userId: number): Order {
    const order = new Order();
    order.orderNumber = randomUUID();
    order.userId = userId;
    order.status = 'CREATED';
    return order;
  }

  confirm(totalAmount: number, balanceAmount: number) {
    this.status = 'CONFIRM';
    this.totalAmount = totalAmount;
    this.balanceAmount = balanceAmount;
  }
}
