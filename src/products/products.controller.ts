import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

type AuthenticatedUser = { id: number; email: string };

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query('category') category?: string) {
    return this.productsService.findAll(category);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @UseGuards(JwtGuard)
  @Post(':id/cart')
  addToCart(
    @Param('id') id: string,
    @Body() addToCartDto: AddToCartDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.addToCart(
      user.id,
      +id,
      addToCartDto.size,
      addToCartDto.quantity ?? 1,
    );
  }
}
