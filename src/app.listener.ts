import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class AppListener {
  private readonly logger = new Logger(AppListener.name);

  @OnEvent('application.bootstrap')
  handleAppBootstrap(payload: any) {
    this.logger.log(payload);
  }
}
