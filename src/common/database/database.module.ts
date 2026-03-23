import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DatabaseSeederService } from './database-seeder.service';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        // 엔티티 자동 스캔은 아래 옵션이 가장 안전합니다.
        autoLoadEntities: true,
        synchronize: true, // 개발 환경 전용
        logging: true,
        dropSchema: true,
        // MySQL 드라이버 옵션 (extra 객체 내부에 선언하거나 직접 지원하는 경우 확인)
        extra: {
          connectionLimit: 10,
        },
      }),
      dataSourceFactory: async (options) => {
        if (!options) throw new Error('Invalid options passed');
        const dataSource = await new DataSource(options).initialize();
        return addTransactionalDataSource(dataSource);
      },
    }),
    TypeOrmModule.forFeature([User, Product]),
    RedisModule,
  ],
  providers: [DatabaseSeederService],
  exports: [DatabaseSeederService],
})
export class DatabaseModule {}
