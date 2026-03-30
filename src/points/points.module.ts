import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Point } from './entities/point.entity';
import { PointsService } from './points.service';
import { PointsConsumer } from './points.consumer';

@Module({
  imports: [TypeOrmModule.forFeature([Point])],
  providers: [PointsService, PointsConsumer],
  exports: [PointsService],
})
export class PointsModule {}
