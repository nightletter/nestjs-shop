import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'int', unsigned: true })
  price: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  salePrice: number | null;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
