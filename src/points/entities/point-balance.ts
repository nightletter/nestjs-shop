import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('points_balance')
export class PointBalance {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int', nullable: false, unsigned: true })
  userId: number;

  @Column({ type: 'int', nullable: false, unsigned: true, default: 0 })
  balance: number;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(userId: number) {
    this.userId = userId;
    this.balance = 0;
  }

  add(amount: number) {
    this.balance += amount;
  }

  subtract(amount: number) {
    this.balance -= Math.abs(amount);

    if (this.balance < 0) {
      this.balance = 0;
    }
  }
}
