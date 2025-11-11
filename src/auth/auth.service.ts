import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private users: Model<UserDocument>,
    private jwt: JwtService,
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
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException();
    return this.issue(user);
  }

  private issue(user: UserDocument) {
    const payload = { sub: user._id.toString(), email: user.email, name: user.name };
    const token = this.jwt.sign(payload);
    return { token, user: { id: payload.sub, email: user.email, name: user.name } };
  }
}
