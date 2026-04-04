import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Point } from './entities/point.entity';
import PointsService from './points.service';
import { PointsConsumer } from './points.consumer';
import { PointsController } from './points.controller';
import { AuthModule } from '@/auth/auth.module';
import { PointsListener } from '@/points/points.listener';
import { PointBalance } from '@/points/entities/point-balance';
import { PointsReader } from '@/points/points.reader';

@Module({
  imports: [TypeOrmModule.forFeature([Point, PointBalance]), AuthModule],
  controllers: [PointsController],
  providers: [PointsService, PointsConsumer, PointsListener, PointsReader],
  exports: [PointsService, PointsReader],
})
export class PointsModule {}
