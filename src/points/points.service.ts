import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Point } from './entities/point.entity';
import { PointBalance } from './entities/point-balance';

@Injectable()
class PointsService {
  constructor(
    @InjectRepository(Point)
    private readonly pointRepository: Repository<Point>,
    @InjectRepository(PointBalance)
    private readonly balanceRepository: Repository<PointBalance>,
  ) {}

  @Transactional()
  async savePointWithBalance(point: Point) {
    await this.pointRepository.save(point);

    const userId = point.userId;

    const pointBalance =
      (await this.balanceRepository.findOne({ where: { userId } })) ??
      (await this.balanceRepository.save(new PointBalance(userId)));

    pointBalance.add(point.amount);
    await this.balanceRepository.save(pointBalance);
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

export default PointsService;
