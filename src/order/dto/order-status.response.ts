import { Expose } from 'class-transformer';

export class OrderStatusResponse {
  @Expose()
  id: number;

  @Expose()
  status: string

  constructor(id: number, status: string) {
    this.id = id;
    this.status = status;
  }
}
