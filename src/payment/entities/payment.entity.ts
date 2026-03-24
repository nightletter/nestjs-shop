import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int', nullable: false, unsigned: true })
  userId: number;

  @Column({ type: 'int', nullable: false, unsigned: true })
  orderId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentKey: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  method: string;

  @Column({ type: 'date', nullable: true })
  approvedAt: Date;

  @Column({ type: 'boolean', default: false })
  is_done: boolean;

  @Column({ type: 'text', nullable: true })
  payload: string;

  @CreateDateColumn()
  createdAt: Date;

  static create(orderId: number, userId: number) {
    const payment = new Payment();
    payment.orderId = orderId;
    payment.userId = userId;
    return payment;
  }
}
