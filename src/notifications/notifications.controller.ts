import { Controller, Param, Req, Sse, UseGuards } from '@nestjs/common';
import { JwtGuard } from '@/auth/guards/jwt.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { NotificationSseService } from '@/notifications/notification-sse.service';

@Controller('/api/notifications')
export class NotificationsController {
  constructor(
    private readonly notificationSseService: NotificationSseService,
  ) {}

  @UseGuards(JwtGuard)
  @Sse('/sse')
  subscribe(@CurrentUser() user: { id: number }, @Req() req: any) {
    return this.notificationSseService.asObservable(user.id);
  }
}
