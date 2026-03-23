import { Expose, Type } from 'class-transformer';

class TossPaymentCardDto {
  @Expose() issuerCode: string;

  @Expose() acquirerCode: string;

  @Expose() number: string;

  @Expose() installmentPlanMonths: number;

  @Expose() isInterestFree: boolean;

  @Expose() interestPayer: string | null;

  @Expose() approveNo: string;

  @Expose() useCardPoint: boolean;

  @Expose() cardType: string;

  @Expose() ownerType: string;

  @Expose() acquireStatus: string;

  @Expose() amount: number;
}

class TossPaymentEasyPayDto {
  @Expose() provider: string;

  @Expose() amount: number;

  @Expose() discountAmount: number;
}

class TossPaymentReceiptDto {
  @Expose() url: string;
}

class TossPaymentCheckoutDto {
  @Expose() url: string;
}

class TossPaymentFailureDto {
  @Expose() code: string;

  @Expose() message: string;
}

export class TossPaymentConfirmResponseDto {
  @Expose() mId: string;

  @Expose() lastTransactionKey: string;

  @Expose() paymentKey: string;

  @Expose() orderId: string;

  @Expose() orderName: string;

  @Expose() taxExemptionAmount: number;

  @Expose() status: string;

  @Expose() requestedAt: string;

  @Expose() approvedAt: string;

  @Expose() useEscrow: boolean;

  @Expose() cultureExpense: boolean;

  @Expose()
  @Type(() => TossPaymentCardDto)
  card: TossPaymentCardDto | null;

  @Expose() virtualAccount: unknown | null;

  @Expose() transfer: unknown | null;

  @Expose() mobilePhone: unknown | null;

  @Expose() giftCertificate: unknown | null;

  @Expose() cashReceipt: unknown | null;

  @Expose() cashReceipts: unknown | null;

  @Expose() discount: unknown | null;

  @Expose() cancels: unknown | null;

  @Expose() secret: string | null;

  @Expose() type: string;

  @Expose()
  @Type(() => TossPaymentEasyPayDto)
  easyPay: TossPaymentEasyPayDto | null;

  @Expose() country: string;

  @Expose()
  @Type(() => TossPaymentFailureDto)
  failure: TossPaymentFailureDto | null;

  @Expose() isPartialCancelable: boolean;

  @Expose()
  @Type(() => TossPaymentReceiptDto)
  receipt: TossPaymentReceiptDto | null;

  @Expose()
  @Type(() => TossPaymentCheckoutDto)
  checkout: TossPaymentCheckoutDto | null;

  @Expose() currency: string;

  @Expose() totalAmount: number;

  @Expose() balanceAmount: number;

  @Expose() suppliedAmount: number;

  @Expose() vat: number;

  @Expose() taxFreeAmount: number;

  @Expose() metadata: Record<string, unknown> | null;

  @Expose() method: string;

  @Expose() version: string;
}
