import { AuthGuard } from '@nestjs/passport';
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      const message =
        info && typeof info === 'object' && 'message' in info
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            String(info.message)
          : 'Unauthorized';
      throw err || new UnauthorizedException(message);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}
