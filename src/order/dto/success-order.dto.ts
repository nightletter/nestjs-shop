import { IsNumber, IsString } from 'class-validator';

export class SuccessOrderDto {
  @IsString()
  paymentType: string;

  @IsString()
  orderId: string;

  @IsString()
  paymentKey: string;

  @IsNumber()
  amount: number;
}
