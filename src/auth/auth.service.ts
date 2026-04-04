import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '@/users/entities/user.entity';
import { AuthTransactionService } from '@/auth/auth-transaction.service';
import { SignupDto } from '@/auth/dto/signup.dto';
import { LoginDto } from '@/auth/dto/login.dto';
import { UserSignupEvent } from '@/users/events/user-signup.event';

type AccessTokenPayload = { id: number; loginId: string; type: 'access' };
type RefreshTokenPayload = { id: number; type: 'refresh' };

@Injectable()
export class AuthService {
  constructor(
    private readonly authTransactionService: AuthTransactionService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async signup(param: SignupDto) {
    const hashedPassword = await bcrypt.hash(param.password, 10);
    const user = await this.authTransactionService.create(
      param.loginId,
      hashedPassword,
    );

    this.eventEmitter.emit('users.signup', new UserSignupEvent(user.id));

    return {
      id: user.id,
      loginId: user.loginId,
      message: 'User registered successfully',
    };
  }

  async login(param: LoginDto) {
    const user = await this.validateUserCredentials(
      param.loginId,
      param.password,
    );

    const { accessToken, refreshToken } = this.issueTokens(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        loginId: user.loginId,
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

    const user = await this.userRepository.findOneByOrFail({ id: payload.id });

    const tokens = this.issueTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        loginId: user.loginId,
      },
    };
  }

  validateToken(token: string): AccessTokenPayload {
    try {
      const payload = this.jwtService.verify<AccessTokenPayload>(token);
      if (!payload.loginId || payload.type !== 'access') {
        throw new UnauthorizedException('Invalid access token');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async validateUserCredentials(
    loginId: string | undefined,
    password: string | undefined,
  ): Promise<User> {
    if (!loginId || !password) {
      throw new BadRequestException('email and password are required');
    }

    const user = await this.userRepository.findOne({
      where: {
        loginId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  private issueTokens(user: Pick<User, 'id' | 'loginId'>): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessPayload: AccessTokenPayload = {
      id: user.id,
      loginId: user.loginId,
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
