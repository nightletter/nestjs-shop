import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtGuard } from '@/auth/guards/jwt.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/users/entities/user.entity';
import PointsService from './points.service';

@Controller('api/points')
@UseGuards(JwtGuard)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('balance')
  async getBalance(@CurrentUser() user: User) {
    const total = await this.pointsService.getTotalPoints(user.id);
    return { balance: total };
  }

  @Get('history')
  async getHistory(@CurrentUser() user: User) {
    const points = await this.pointsService.getUserPoints(user.id);
    return { points };
  }
}
