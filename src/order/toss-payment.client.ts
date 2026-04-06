import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { firstValueFrom } from 'rxjs';
import { SuccessOrderDto } from './dto/success-order.dto';
import { TossPaymentConfirmResponseDto } from './dto/toss-payment-confirm-response.dto';

@Injectable()
export class TossPaymentClient {
  private readonly logger = new Logger(TossPaymentClient.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async confirm(param: SuccessOrderDto) {
    const apiKey = this.configService.get<string>('toss.payment.apiKey');
    const token = Buffer.from(`${apiKey}:`).toString('base64');

    const data = {
      paymentKey: param.paymentKey,
      orderId: param.orderId,
      amount: param.amount,
    };

    const result = await firstValueFrom(
      this.httpService.post(
        'https://api.tosspayments.com/v1/payments/confirm',
        JSON.stringify(data),
        {
          headers: {
            Authorization: `Basic ${token}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    )
      .then((res) => {
        this.logger.log('then');
        return res.data;
      })
      .catch((err) => {
        this.logger.error(err);
      });

    return plainToInstance(TossPaymentConfirmResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }
}
