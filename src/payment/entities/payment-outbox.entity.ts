import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('payment-outbox')
export class PaymentOutboxEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'text', nullable: false, unsigned: true })
  payload: string;
}
