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
import { Product } from './product.entity';

export enum ProductSize {
  S = 's',
  M = 'm',
  L = 'l',
  XL = 'xl',
  XXL = 'xxl',
}

@Entity('product_options')
@Unique(['productId', 'size'])
export class ProductOption {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int' })
  productId: number;

  @Column({ type: 'enum', enum: ProductSize })
  size: ProductSize;

  @Column({ type: 'int', unsigned: true, default: 0 })
  stock: number;

  @ManyToOne(() => Product, (product) => product.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
