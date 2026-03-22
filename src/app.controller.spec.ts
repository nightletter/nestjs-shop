import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import type { Response } from 'express';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
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
});
