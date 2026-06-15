import { Body, Controller, Get, HttpCode, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new tenant', description: 'Creates a user account and a new Organization. The first user becomes the OWNER. A verification email is sent.' })
  @ApiResponse({ status: 201, description: 'Registration successful — check email to verify.' })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  @ApiResponse({ status: 422, description: 'Validation error.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login', description: 'Authenticates the user. Returns a JWT access token in the response body and sets HTTP-only cookies (access_token, refresh_token).' })
  @ApiResponse({ status: 200, description: 'Login successful — access token returned, cookies set.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or email not verified.' })
  login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, req, res);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh-token')
  @HttpCode(200)
  @ApiCookieAuth('refresh_token')
  @ApiOperation({ summary: 'Rotate refresh token', description: 'Issues a new access token and rotates the refresh token. Requires a valid refresh_token cookie.' })
  @ApiResponse({ status: 200, description: 'New access token issued, cookies rotated.' })
  @ApiResponse({ status: 401, description: 'Refresh token missing, invalid, or expired.' })
  refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as any;
    return this.authService.refreshToken(user.sub, user.sessionId, user.rawRefreshToken, res);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout current session', description: 'Invalidates the current session and clears auth cookies.' })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  logout(@CurrentUser() user: JwtPayload, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(user.sessionId, res);
  }

  @Post('logout-all')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout all sessions', description: 'Invalidates every active session for the current user across all devices.' })
  @ApiResponse({ status: 200, description: 'All sessions terminated.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  logoutAll(@CurrentUser() user: JwtPayload, @Res({ passthrough: true }) res: Response) {
    return this.authService.logoutAll(user.sub, res);
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address', description: 'Confirms the user\'s email using the token sent in the verification email.' })
  @ApiQuery({ name: 'token', required: true, description: 'Email verification token from the link in the email.' })
  @ApiResponse({ status: 200, description: 'Email verified — user can now log in.' })
  @ApiResponse({ status: 401, description: 'Token invalid or expired.' })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(200)
  @ApiOperation({ summary: 'Resend verification email', description: 'Sends a new verification email. Always returns the same safe response to prevent user enumeration.' })
  @ApiResponse({ status: 200, description: 'Safe response sent regardless of whether the email is registered.' })
  resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request password reset', description: 'Sends a password reset link to the email if it is registered. Always returns the same safe response.' })
  @ApiResponse({ status: 200, description: 'Safe response — reset link sent if email is registered.' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset password', description: 'Sets a new password using the one-time token from the reset email. Invalidates all active sessions.' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 401, description: 'Token invalid, expired, or already used.' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
