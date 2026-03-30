import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Point } from './entities/point.entity';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(Point)
    private readonly pointRepository: Repository<Point>,
  ) {}

  async earnPoints(
    userId: number,
    amount: number,
    reason: string,
    orderId?: number,
  ): Promise<Point> {
    const point = Point.create(userId, amount, reason, orderId);
    return this.pointRepository.save(point);
  }

  async getUserPoints(userId: number): Promise<Point[]> {
    return this.pointRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTotalPoints(userId: number): Promise<number> {
    const points = await this.getUserPoints(userId);
    return points.reduce((total, point) => total + point.amount, 0);
  }
}
