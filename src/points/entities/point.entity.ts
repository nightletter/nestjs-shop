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

  @Column({ type: 'varchar', length: 255, nullable: false })
  refType: string;

  @Column({ type: 'int', nullable: false, unique: true })
  refId: number;

  @Column({ type: 'int', nullable: false, unsigned: true })
  userId: number;

  @Column({ type: 'int', nullable: false, unsigned: false })
  amount: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  static create(
    userId: number,
    refType: string,
    refId: number,
    amount: number,
    description: string,
  ): Point {
    const point = new Point();
    point.userId = userId;
    point.amount = amount;
    point.refType = refType;
    point.refId = refId;
    point.description = description;
    return point;
  }
}
