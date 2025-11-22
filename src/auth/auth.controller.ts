import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../common/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.signup(dto.email, dto.password, dto.name);
    res.cookie('token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    });
    return result;
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto.email, dto.password);
    res.cookie('token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    });
    return result;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { sub: string; email: string; name?: string }) {
    return {
      user: {
        id: user.sub,
        email: user.email,
        name: user.name,
      },
    };
  }
}
