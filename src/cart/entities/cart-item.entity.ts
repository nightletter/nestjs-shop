import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProductOption } from '../../products/entities/product-option.entity';

@Entity('cart_items')
@Unique(['userId', 'productOptionId'])
export class CartItem {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  productOptionId: number;

  @Column({ type: 'int', unsigned: true, default: 1 })
  quantity: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => ProductOption, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productOptionId', referencedColumnName: 'id' })
  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
