import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductCategory } from './product-category.entity';
import { ProductOption } from './product-option.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'int' })
  categoryId: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  material: string;

  @Column({ type: 'varchar', length: 100 })
  origin: string;

  @Column({ type: 'varchar', length: 255 })
  washingMethod: string;

  @Column({ type: 'int', unsigned: true })
  price: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  salePrice: number | null;

  @ManyToOne(() => ProductCategory, (category) => category.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'categoryId' })
  category: ProductCategory;

  @OneToMany(() => ProductOption, (option) => option.product)
  options: ProductOption[];

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
