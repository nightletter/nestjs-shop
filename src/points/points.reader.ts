import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointBalance } from './entities/point-balance';

@Injectable()
export class PointsReader {
  constructor(
    @InjectRepository(PointBalance)
    private readonly balanceRepository: Repository<PointBalance>,
  ) {}

  async getBalance(userId: number): Promise<number> {
    const balance = await this.balanceRepository.findOne({ where: { userId } });
    return balance?.balance ?? 0;
  }
}
