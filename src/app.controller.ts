import {
  Catch,
  Controller,
  ExceptionFilter,
  Get,
  Res,
  UnauthorizedException,
  UseFilters,
  UseGuards,
  type ArgumentsHost,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtGuard } from './auth/guards/jwt.guard';

@Catch(UnauthorizedException)
export class UnauthorizedRedirectFilter implements ExceptionFilter {
  catch(_: UnauthorizedException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.redirect('/');
  }
}

@Controller()
@UseFilters(UnauthorizedRedirectFilter)
export class AppController {
  @Get()
  renderIndex(@Res() res: Response): void {
    res.render('index');
  }

  @Get('products')
  renderProducts(@Res() res: Response): void {
    res.render('product');
  }

  @UseGuards(JwtGuard)
  @Get('order/complete')
  renderOrderCompleteAlias(@Res() res: Response): void {
    res.render('complete');
  }

  @Get('order/fail')
  handlePaymentFail(@Query() query: any, @Res() res: Response) {
    res.render('product');
  }
}
