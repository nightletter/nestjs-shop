import { AppController, UnauthorizedRedirectFilter } from './app.controller';
import type { Response } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(() => {
    appController = new AppController();
  });

  describe('routes', () => {
    it('should render index template', () => {
      const render = jest.fn();
      const res = { render } as unknown as Response;

      appController.renderIndex(res);

      expect(render).toHaveBeenCalledWith('index');
    });

    it('should render product template', () => {
      const render = jest.fn();
      const res = { render } as unknown as Response;

      appController.renderProducts(res);

      expect(render).toHaveBeenCalledWith('product');
    });

    it('should render complete template for /order/complate', () => {
      const render = jest.fn();
      const res = { render } as unknown as Response;

      appController.renderOrderComplete(res);

      expect(render).toHaveBeenCalledWith('complete');
    });

    it('should render complete template for /order/complete alias', () => {
      const render = jest.fn();
      const res = { render } as unknown as Response;

      appController.renderOrderCompleteAlias(res);

      expect(render).toHaveBeenCalledWith('complete');
    });
  });

  describe('UnauthorizedRedirectFilter', () => {
    it('should redirect to / when UnauthorizedException is thrown', () => {
      const redirect = jest.fn();
      const response = { redirect } as unknown as Response;
      const filter = new UnauthorizedRedirectFilter();
      const host = {
        switchToHttp: () => ({
          getResponse: () => response,
        }),
      } as unknown as ArgumentsHost;

      filter.catch(new UnauthorizedException(), host);

      expect(redirect).toHaveBeenCalledWith('/');
    });
  });
});
