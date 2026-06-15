import { Body, Controller, Get, HttpCode, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtPayload } from './strategies/jwt-access.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, req, res);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh-token')
  @HttpCode(200)
  refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as any;
    return this.authService.refreshToken(user.sub, user.sessionId, user.rawRefreshToken, res);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@CurrentUser() user: JwtPayload, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(user.sessionId, res);
  }

  @Post('logout-all')
  @HttpCode(200)
  logoutAll(@CurrentUser() user: JwtPayload, @Res({ passthrough: true }) res: Response) {
    return this.authService.logoutAll(user.sub, res);
  }

  @Public()
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(200)
  resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
