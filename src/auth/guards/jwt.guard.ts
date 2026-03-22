import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

type JwtPayload = { id: number; email: string; type: 'access' };
type RequestWithUser = Request & { user?: JwtPayload };

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      if (payload.type !== 'access' || !payload.email) {
        throw new UnauthorizedException('Invalid access token');
      }
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: Request): string | undefined {
    const headers = request.headers as Record<string, unknown>;
    const rawAuthorization = headers['authorization'];
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
}
