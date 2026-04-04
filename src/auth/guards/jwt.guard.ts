import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthService } from '@/auth/auth.service';

type JwtPayload = { id: number; loginId: string; type: 'access' };
type RequestWithUser = Request & { user?: JwtPayload };

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      if (payload.type !== 'access' || !payload.loginId) {
        throw new UnauthorizedException('Invalid access token');
      }

      await this.authService.validateUser(payload.id);
      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: Request): string | undefined {
    const cookieToken = this.extractTokenFromCookie(request);
    if (cookieToken) {
      return cookieToken;
    }

    const headers = request.headers as Record<string, unknown>;
    const rawAuthorization = headers.authorization;
    let authHeader: string | undefined;

    if (typeof rawAuthorization === 'string') {
      authHeader = rawAuthorization;
    } else if (
      Array.isArray(rawAuthorization) &&
      typeof rawAuthorization[0] === 'string'
    ) {
      authHeader = rawAuthorization[0];
    }

    if (!authHeader) {
      return undefined;
    }

    const [scheme, token] = authHeader.trim().split(/\s+/);
    if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
      return undefined;
    }

    return token;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    const cookieHeader = request.headers.cookie;

    if (typeof cookieHeader !== 'string' || cookieHeader.length === 0) {
      return undefined;
    }

    const encodedCookie = cookieHeader
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('accessToken='));

    if (!encodedCookie) {
      return undefined;
    }

    const [, encodedToken] = encodedCookie.split('=');
    if (!encodedToken) {
      return undefined;
    }

    return decodeURIComponent(encodedToken);
  }
}
