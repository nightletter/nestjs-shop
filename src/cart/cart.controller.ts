import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CartService } from './cart.service';
import { UpdateCartQuantityDto } from './dto/update-cart-quantity.dto';

type AuthenticatedUser = { id: number; email: string };

@Controller('cart-items')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtGuard)
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.cartService.findAll(user.id);
  }

  @UseGuards(JwtGuard)
  @Patch(':id/quantity')
  updateQuantity(
    @Param('id') id: string,
    @Body() updateCartQuantityDto: UpdateCartQuantityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cartService.updateQuantity(
      user.id,
      +id,
      updateCartQuantityDto.quantity,
    );
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.cartService.remove(user.id, +id);
  }
}
