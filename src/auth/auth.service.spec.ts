import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { AuthTransactionService } from './auth-transaction.service';
import { User } from '@/users/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let authTransactionService: jest.Mocked<AuthTransactionService>;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockUser: User = {
    id: 1,
    loginId: 'user@example.com',
    password: 'hashed-password',
    nickname: 'user',
    isActive: true,
    createAt: new Date(),
    updateAt: new Date(),
  };

  beforeEach(async () => {
    const authTransactionServiceMock = {
      create: jest.fn(),
    };
    const userRepositoryMock = {
      findOne: jest.fn(),
      findOneByOrFail: jest.fn(),
      existsBy: jest.fn(),
    };
    const jwtServiceMock = {
      sign: jest.fn(),
      verify: jest.fn(),
    };
    const eventEmitterMock = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthTransactionService,
          useValue: authTransactionServiceMock,
        },
        { provide: 'UserRepository', useValue: userRepositoryMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: EventEmitter2, useValue: eventEmitterMock },
      ],
    })
      .overrideProvider('UserRepository')
      .useValue(userRepositoryMock)
      .compile();

    service = module.get<AuthService>(AuthService);
    authTransactionService = module.get(
      AuthTransactionService,
    ) as jest.Mocked<AuthTransactionService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    eventEmitter = module.get(EventEmitter2) as jest.Mocked<EventEmitter2>;

    // Manually inject userRepository since it's injected via decorator
    userRepository = userRepositoryMock as jest.Mocked<Repository<User>>;
    (service as any).userRepository = userRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user and emit signup event', async () => {
      const signupDto: SignupDto = {
        loginId: 'newuser@example.com',
        password: 'password123',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      authTransactionService.create.mockResolvedValue(mockUser);

      const result = await service.signup(signupDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(authTransactionService.create).toHaveBeenCalledWith(
        'newuser@example.com',
        'hashed-password',
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'users.signup',
        expect.anything(),
      );
      expect(result).toEqual({
        id: 1,
        loginId: 'user@example.com',
        message: 'User registered successfully',
      });
    });
  });

  describe('login', () => {
    it('should login and issue tokens', async () => {
      const loginDto: LoginDto = {
        loginId: 'user@example.com',
        password: 'password123',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { loginId: 'user@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password',
      );
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        1,
        { id: 1, loginId: 'user@example.com', type: 'access' },
        { expiresIn: '1h' },
      );
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        { id: 1, type: 'refresh' },
        { expiresIn: '7d' },
      );
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 1, loginId: 'user@example.com' },
      });
    });

    it('should throw BadRequestException when loginId is missing', async () => {
      const loginDto: LoginDto = {
        loginId: '',
        password: 'password123',
      };

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when password is missing', async () => {
      const loginDto: LoginDto = {
        loginId: 'user@example.com',
        password: '',
      };

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const loginDto: LoginDto = {
        loginId: 'nonexistent@example.com',
        password: 'password123',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      const loginDto: LoginDto = {
        loginId: 'user@example.com',
        password: 'wrong-password',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('should refresh tokens with a valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';

      jwtService.verify.mockReturnValue({
        id: 1,
        type: 'refresh',
      });
      userRepository.findOneByOrFail.mockResolvedValue(mockUser);
      jwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.refresh(refreshToken);

      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken);
      expect(userRepository.findOneByOrFail).toHaveBeenCalledWith({
        id: 1,
      });
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: { id: 1, loginId: 'user@example.com' },
      });
    });

    it('should throw BadRequestException when refreshToken is missing', async () => {
      await expect(service.refresh('')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refresh('invalid-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token type is not refresh', async () => {
      jwtService.verify.mockReturnValue({
        id: 1,
        type: 'access',
      });

      await expect(
        service.refresh('access-token-instead'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should validate an active user', async () => {
      userRepository.existsBy.mockResolvedValue(true);

      await service.validateUser(1);

      expect(userRepository.existsBy).toHaveBeenCalledWith({
        id: 1,
        isActive: true,
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      userRepository.existsBy.mockResolvedValue(false);

      await expect(service.validateUser(999)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('validateToken', () => {
    it('should validate a correct access token', () => {
      const token = 'valid-access-token';
      jwtService.verify.mockReturnValue({
        id: 1,
        loginId: 'user@example.com',
        type: 'access',
      });

      const result = service.validateToken(token);

      expect(jwtService.verify).toHaveBeenCalledWith(token);
      expect(result).toEqual({
        id: 1,
        loginId: 'user@example.com',
        type: 'access',
      });
    });

    it('should throw UnauthorizedException when token is invalid', () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => service.validateToken('invalid-token')).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when loginId is missing', () => {
      jwtService.verify.mockReturnValue({
        id: 1,
        type: 'access',
      });

      expect(() => service.validateToken('token-without-loginid')).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token type is not access', () => {
      jwtService.verify.mockReturnValue({
        id: 1,
        loginId: 'user@example.com',
        type: 'refresh',
      });

      expect(() => service.validateToken('refresh-token-instead')).toThrow(
        UnauthorizedException,
      );
    });
  });
});
