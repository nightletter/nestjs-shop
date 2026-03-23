import { Expose } from 'class-transformer';

export class CreatedOrderDto {
  @Expose()
  id: number;

  @Expose()
  orderNumber: string;
}
