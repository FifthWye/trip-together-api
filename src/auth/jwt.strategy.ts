import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  name?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'dev-secret';

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const extractors = ExtractJwt.fromExtractors([
      (req: Request) => {
        // Try cookie first
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const cookieToken = req?.cookies?.token;
        if (cookieToken && typeof cookieToken === 'string') {
          return cookieToken;
        }
        // Then try Authorization header
        const authHeader = req?.headers?.authorization;
        if (
          authHeader &&
          typeof authHeader === 'string' &&
          authHeader.startsWith('Bearer ')
        ) {
          return authHeader.substring(7);
        }
        return null;
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ExtractJwt.fromAuthHeaderAsBearerToken(), // fallback
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      jwtFromRequest: extractors,
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: JwtPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  }
}
