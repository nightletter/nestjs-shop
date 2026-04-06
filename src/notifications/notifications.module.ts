import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsConsumer } from './notifications.consumer';
import { NotificationsController } from '@/notifications/notifications.controller';
import { NotificationSseService } from '@/notifications/notification-sse.service';
import { AuthModule } from '@/auth/auth.module';

@Module({
  controllers: [NotificationsController],
  imports: [TypeOrmModule.forFeature([Notification]), AuthModule],
  providers: [
    NotificationsService,
    NotificationsConsumer,
    NotificationSseService,
  ],
  exports: [NotificationsService, NotificationSseService],
})
export class NotificationsModule {}
