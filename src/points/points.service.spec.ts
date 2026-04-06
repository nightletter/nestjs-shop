import { Test, TestingModule } from '@nestjs/testing';
import PointsService from './points.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Point } from './entities/point.entity';
import { PointBalance } from './entities/point-balance';
import { Repository } from 'typeorm';

describe('PointsService', () => {
  let service: PointsService;
  let pointRepository: jest.Mocked<Repository<Point>>;
  let balanceRepository: jest.Mocked<Repository<PointBalance>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointsService,
        {
          provide: getRepositoryToken(Point),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PointBalance),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PointsService>(PointsService);
    pointRepository = module.get(getRepositoryToken(Point));
    balanceRepository = module.get(getRepositoryToken(PointBalance));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPoints', () => {
    it('사용자의 포인트 내역을 조회해야 함', async () => {
      const points = [
        Point.create(1, 'user.signup', 1, 5000, '회원가입'),
        Point.create(1, 'order.complete', 100, -3000, '사용'),
        Point.create(1, 'order.complete', 100, 300, '적립'),
      ];

      pointRepository.find.mockResolvedValue(points);

      const result = await service.getUserPoints(1);

      expect(result).toEqual(points);
      expect(pointRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getTotalPoints', () => {
    it('사용자의 총 포인트를 계산해야 함', async () => {
      const points = [
        Point.create(1, 'user.signup', 1, 5000, '회원가입'),
        Point.create(1, 'order.complete', 100, -3000, '사용'),
        Point.create(1, 'order.complete', 100, 300, '적립'),
      ];

      pointRepository.find.mockResolvedValue(points);

      const result = await service.getTotalPoints(1);

      expect(result).toBe(2300); // 5000 - 3000 + 300
    });
  });
});

