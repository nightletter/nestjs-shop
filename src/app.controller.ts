import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  renderIndex(@Res() res: Response): void {
    res.render('index');
  }

  @Get('products')
  renderProducts(@Res() res: Response): void {
    res.render('product');
  }

  @Get('order/complate')
  renderOrderComplete(@Res() res: Response): void {
    res.render('complete');
  }

  @Get('order/complete')
  renderOrderCompleteAlias(@Res() res: Response): void {
    res.render('complete');
  }
}
