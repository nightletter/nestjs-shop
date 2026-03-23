import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

type AccessTokenPayload = { id: number; email: string; type: 'access' };
type RefreshTokenPayload = { id: number; type: 'refresh' };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(email: string, password: string) {
    if (!email || !password) {
      throw new BadRequestException('email and password are required');
    }

    const user = await this.usersService.create({
      email,
      password,
      nickname: email.split('@')[0],
    });

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      message: 'User registered successfully',
    };
  }

  async login(email: string, password: string) {
    const user = await this.validateUserCredentials(email, password);
    const { accessToken, refreshToken } = this.issueTokens(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('refreshToken is required');
    }

    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findOne(payload.id);
    const tokens = this.issueTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
    };
  }

  validateToken(token: string): AccessTokenPayload {
    try {
      const payload = this.jwtService.verify<AccessTokenPayload>(token);
      if (!payload.email || payload.type !== 'access') {
        throw new UnauthorizedException('Invalid access token');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async validateUserCredentials(
    email: string,
    password: string,
  ): Promise<User> {
    if (!email || !password) {
      throw new BadRequestException('email and password are required');
    }

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  private issueTokens(user: Pick<User, 'id' | 'email'>): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessPayload: AccessTokenPayload = {
      id: user.id,
      email: user.email,
      type: 'access',
    };
    const refreshPayload: RefreshTokenPayload = {
      id: user.id,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: '1h',
    });
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
