import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private users: Model<UserDocument>,
    private jwt: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(email: string, password: string, name?: string) {
    const existing = await this.users.findOne({ email });
    if (existing) throw new ConflictException('Email already in use');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.users.create({ email, passwordHash, name });
    return this.issue(user);
  }

  async login(email: string, password: string) {
    const user = await this.users.findOne({ email });
    if (!user) throw new UnauthorizedException();
    if (!user.passwordHash) {
      throw new UnauthorizedException('Use Google sign in for this account');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException();
    return this.issue(user);
  }

  async loginWithGoogle(idToken: string) {
    const clientIds = [
      this.configService.get<string>('GOOGLE_WEB_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_IOS_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_ANDROID_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_EXPO_CLIENT_ID'),
    ].filter(Boolean) as string[];

    if (clientIds.length === 0) {
      throw new UnauthorizedException('Google sign in is not configured');
    }

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientIds,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;
    const googleId = payload?.sub;

    if (!email || !googleId || payload?.email_verified === false) {
      throw new UnauthorizedException('Invalid Google account');
    }

    let user = await this.users.findOne({ email });
    if (!user) {
      user = await this.users.create({
        email,
        googleId,
        authProvider: 'google',
        name: payload?.name || email.split('@')[0],
        avatarUrl: payload?.picture,
      });
    } else {
      user.googleId = user.googleId || googleId;
      user.authProvider = user.authProvider || 'google';
      user.name = user.name || payload?.name;
      user.avatarUrl = user.avatarUrl || payload?.picture;
      await user.save();
    }

    return this.issue(user);
  }

  private issue(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    };
    const token = this.jwt.sign(payload);
    return {
      token,
      user: { id: payload.sub, email: user.email, name: user.name },
    };
  }
}
