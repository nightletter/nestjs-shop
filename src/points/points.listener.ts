import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserSignupEvent } from '@/users/events/user-signup.event';
import PointsService from '@/points/points.service';
import { Point } from '@/points/entities/point.entity';
import { QueueEvents } from '@/common/constants/queue-events.constants';

@Injectable()
export class PointsListener {
  private readonly logger = new Logger(PointsListener.name);

  constructor(private readonly pointsService: PointsService) {}

  @OnEvent('users.signup')
  async handleEarnPoint(event: UserSignupEvent): Promise<void> {
    const point = Point.create(
      event.id,
      'user.signup',
      event.id,
      5000,
      '회원가입',
    );

    await this.pointsService.earnPointWithBalance(point);
  }
}
