import { IsBoolean, IsInt, IsPositive } from 'class-validator';

export class CreateOrderRequest {
  @IsInt()
  @IsPositive()
  productId: number;

  @IsInt()
  @IsPositive()
  salePrice: number;

  @IsBoolean()
  useAllPoints: boolean;
}
