import { Expose } from 'class-transformer';

export class CreatedOrderResponse {
  @Expose()
  id: number;

  @Expose()
  orderNumber: string;
}
