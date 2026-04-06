import { Expose } from 'class-transformer';

export class OrderStatusResponse {
  @Expose()
  id: number;

  @Expose()
  status: string;

  @Expose()
  totalAmount?: number;

  @Expose()
  pointsUsed?: number;

  constructor(
    id: number,
    status: string,
    totalAmount?: number,
    pointsUsed?: number,
  ) {
    this.id = id;
    this.status = status;
    this.totalAmount = totalAmount;
    this.pointsUsed = pointsUsed;
  }
}
