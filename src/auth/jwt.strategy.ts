import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'dev-secret';

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          // Try cookie first
          const cookieToken = req?.cookies?.token;
          if (cookieToken) {
            return cookieToken;
          }
          // Then try Authorization header
          const authHeader = req?.headers?.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
          }
          return null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(), // fallback
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
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
