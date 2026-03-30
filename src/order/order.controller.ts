import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import OrderService from './order.service';
import { SuccessOrderDto } from './dto/success-order.dto';
import { CreateOrderRequest } from './dto/create-order.request';

@Controller('api/order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtGuard)
  @Post()
  async create(
    @CurrentUser() user: { id: number },
    @Body() request: CreateOrderRequest,
  ) {
    return this.orderService.create(user.id, request);
  }

  @Post('/confirm')
  async findAll(@Body() param: SuccessOrderDto) {
    await this.orderService.confirm(param);
  }

  @UseGuards(JwtGuard)
  @Get(':id/status')
  async getOrder(
    @CurrentUser() user: { id: number },
    @Param('id') orderId: string,
  ) {
    return this.orderService.getOrderStatus(user.id, parseInt(orderId, 10));
  }
}
