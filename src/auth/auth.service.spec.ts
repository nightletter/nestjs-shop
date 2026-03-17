import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'findByEmail'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(async () => {
    const usersServiceMock: jest.Mocked<Pick<UsersService, 'findByEmail'>> = {
      findByEmail: jest.fn(),
    };
    const jwtServiceMock: jest.Mocked<Pick<JwtService, 'sign'>> = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('logs in and issues tokens', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      password: 'hashed-password',
      nickname: 'user',
      isActive: true,
      createAt: new Date(),
      updateAt: new Date(),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtService.sign
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');

    const result = await service.login('user@example.com', 'password123');

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 1, email: 'user@example.com', nickname: 'user' },
    });
    expect(jwtService.sign).toHaveBeenNthCalledWith(
      1,
      { id: 1, email: 'user@example.com' },
      { expiresIn: '1h' },
    );
    expect(jwtService.sign).toHaveBeenNthCalledWith(
      2,
      { id: 1 },
      { expiresIn: '7d' },
    );
  });

  it('throws when email or password is missing', async () => {
    await expect(service.login('', 'password123')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when password does not match', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      password: 'hashed-password',
      nickname: 'user',
      isActive: true,
      createAt: new Date(),
      updateAt: new Date(),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login('user@example.com', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
