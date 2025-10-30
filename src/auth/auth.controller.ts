import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private jwt: JwtService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.auth.validateUser(dto.email, dto.password);
    const tokens = await this.auth.signTokens(user.id, user.email, user.role);
    return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    const decoded = this.jwt.decode(dto.refreshToken) as any;
    if (!decoded?.sub) throw new Error('Token inválido');
    return this.auth.refresh(decoded.sub, dto.refreshToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  profile(@Req() req: any) {
    const user = req.user; // viene desde JwtStrategy.validate()
    return { id: user.id, email: user.email, role: user.role };
  }
}