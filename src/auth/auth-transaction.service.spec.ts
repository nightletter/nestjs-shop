import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthTransactionService } from '@/auth/auth-transaction.service';
import { User } from '@/users/entities/user.entity';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => () => {},
  initializeTransactionalContext: jest.fn(),
  addTransactionalDataSource: jest.fn(),
}));

describe('AuthTransactionService', () => {
  let sut: AuthTransactionService;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: 1,
    loginId: 'user@example.com',
    password: 'hashed-password',
    isActive: true,
    createAt: new Date(),
    updateAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<Repository<User>>> = {
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthTransactionService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    sut = module.get<AuthTransactionService>(AuthTransactionService);
    userRepository = module.get(getRepositoryToken(User)) as jest.Mocked<
      Repository<User>
    >;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should save user with loginId and hashedPassword and return the saved user', async () => {
      const loginId = 'user@example.com';
      const hashedPassword = 'hashed-password';

      userRepository.save.mockResolvedValue(mockUser);

      const result = await sut.create(loginId, hashedPassword);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ loginId, password: hashedPassword }),
      );
      expect(result.loginId).toBe(loginId);
      expect(result.password).toBe(hashedPassword);
      expect(result.id).toBe(mockUser.id);
    });

    it('should handle repository.save failure gracefully', async () => {
      const loginId = 'user@example.com';
      const hashedPassword = 'hashed-password';
      const dbError = new Error('Database connection failed');

      userRepository.save.mockRejectedValue(dbError);

      await expect(sut.create(loginId, hashedPassword)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should call save with User entity created by User.create', async () => {
      const loginId = 'newuser@example.com';
      const hashedPassword = 'secure-hash';

      userRepository.save.mockResolvedValue({
        ...mockUser,
        loginId,
        password: hashedPassword,
      });

      await sut.create(loginId, hashedPassword);

      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          loginId,
          password: hashedPassword,
        }),
      );
    });
  });
});
