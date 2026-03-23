import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrderService } from './order.service';
import { SuccessOrderDto } from './dto/success-order.dto';

@Controller('api/order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtGuard)
  @Post()
  async create(@CurrentUser() user: { id: number }) {
    return this.orderService.create(user.id);
  }

  @Get('/confirm')
  async findAll(@Query() param: SuccessOrderDto) {
    await this.orderService.confirm(param);
  }
}
