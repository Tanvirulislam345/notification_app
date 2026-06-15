import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomUUID } from 'crypto';
import { Repository, IsNull } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserOrganizationMembership } from '../organizations/entities/user-organization-membership.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { Role } from '../roles/entities/role.entity';
import { SessionsService } from '../sessions/sessions.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt-access.strategy';
import { Response, Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Organization) private readonly orgsRepo: Repository<Organization>,
    @InjectRepository(UserOrganizationMembership)
    private readonly membershipsRepo: Repository<UserOrganizationMembership>,
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
    @InjectRepository(EmailVerificationToken)
    private readonly evtRepo: Repository<EmailVerificationToken>,
    @InjectRepository(PasswordResetToken)
    private readonly prtRepo: Repository<PasswordResetToken>,
    private readonly sessionsService: SessionsService,
    private readonly auditLogs: AuditLogsService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.usersRepo.save(
      this.usersRepo.create({
        name: dto.name,
        email: dto.email,
        passwordHash,
        isEmailVerified: false,
      }),
    );

    const org = await this.orgsRepo.save(
      this.orgsRepo.create({ name: dto.organizationName, ownerId: user.id, status: 'active' }),
    );

    const ownerRole = await this.rolesRepo.findOne({ where: { name: 'OWNER', organizationId: IsNull() } });
    if (!ownerRole) throw new NotFoundException('OWNER role not found — run seed first');

    await this.membershipsRepo.save(
      this.membershipsRepo.create({ userId: user.id, organizationId: org.id, roleId: ownerRole.id }),
    );

    const token = randomUUID();
    await this.evtRepo.save(
      this.evtRepo.create({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
    );
    await this.mailService.sendVerificationEmail(user.email, token);

    await this.auditLogs.log(org.id, user.id, 'user.registered', 'user', { email: user.email });

    return { message: 'Registration successful. Check your email to verify your account.' };
  }

  async login(dto: LoginDto, req: Request, res: Response) {
    const user = await this.usersRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: dto.email })
      .getOne();

    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    if (!user.isEmailVerified)
      throw new UnauthorizedException('Please verify your email address before logging in');

    const membership = await this.membershipsRepo.findOne({ where: { userId: user.id } });
    if (!membership) throw new UnauthorizedException('No active organization membership');

    const { accessToken, refreshToken } = await this.generateTokenPair(user, membership, req);

    this.setAuthCookies(res, accessToken, refreshToken);
    await this.auditLogs.log(membership.organizationId, user.id, 'user.login', 'session', {
      ip: req.ip,
    });

    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name },
      organizationId: membership.organizationId,
    };
  }

  async refreshToken(userId: string, sessionId: string, rawToken: string, res: Response) {
    const session = await this.sessionsService.findByRefreshToken(rawToken);
    if (!session || session.userId !== userId || session.id !== sessionId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (session.expiresAt < new Date()) {
      await this.sessionsService.invalidateSession(session.id);
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    const membership = await this.membershipsRepo.findOne({ where: { userId } });
    if (!membership) throw new UnauthorizedException('No active membership');

    await this.sessionsService.invalidateSession(session.id);

    const { accessToken, refreshToken } = await this.generateTokenPair(user, membership, null);
    this.setAuthCookies(res, accessToken, refreshToken);

    return { accessToken };
  }

  async logout(sessionId: string, res: Response): Promise<{ message: string }> {
    await this.sessionsService.invalidateSession(sessionId);
    this.clearAuthCookies(res);
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string, res: Response): Promise<{ message: string }> {
    await this.sessionsService.invalidateAllSessions(userId);
    this.clearAuthCookies(res);
    return { message: 'All sessions terminated' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const record = await this.evtRepo.findOne({ where: { token } });
    if (!record || record.expiresAt < new Date() || record.verifiedAt)
      throw new UnauthorizedException('Invalid or expired verification link');

    await this.usersRepo.update(record.userId, { isEmailVerified: true });
    await this.evtRepo.update(record.id, { verifiedAt: new Date() });

    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const safe = { message: 'If your email is registered and unverified, a new link has been sent.' };
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user || user.isEmailVerified) return safe;

    const token = randomUUID();
    await this.evtRepo.save(
      this.evtRepo.create({ userId: user.id, token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }),
    );
    await this.mailService.sendVerificationEmail(user.email, token);
    return safe;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const safe = { message: 'If that email is registered, a reset link has been sent.' };
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) return safe;

    const token = randomUUID();
    await this.prtRepo.save(
      this.prtRepo.create({ userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }),
    );
    await this.mailService.sendPasswordResetEmail(user.email, token);
    return safe;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const record = await this.prtRepo.findOne({ where: { token } });
    if (!record || record.expiresAt < new Date() || record.usedAt)
      throw new UnauthorizedException('Invalid or expired reset link');

    const passwordHash = await argon2.hash(newPassword);
    await this.usersRepo.update(record.userId, { passwordHash });
    await this.prtRepo.update(record.id, { usedAt: new Date() });
    await this.sessionsService.invalidateAllSessions(record.userId);

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  private async generateTokenPair(
    user: User,
    membership: UserOrganizationMembership,
    req?: Request | null,
  ) {
    const rawRefreshToken = randomBytes(32).toString('hex');
    const refreshExpiresDays: number = this.config.get('jwt.refreshExpiresDays') ?? 7;
    const expiresAt = new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000);

    const sessionId = await this.sessionsService.createSession({
      userId: user.id,
      organizationId: membership.organizationId,
      refreshToken: rawRefreshToken,
      deviceInfo: req ? { userAgent: req.headers['user-agent'] ?? '' } : {},
      ipAddress: req?.ip ?? '',
      expiresAt,
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      organizationId: membership.organizationId,
      roleId: membership.roleId,
      sessionId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id, sessionId, raw: rawRefreshToken },
      {
        secret: this.config.get('jwt.refreshSecret'),
        expiresIn: `${refreshExpiresDays}d`,
      },
    );

    return { accessToken, refreshToken };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = this.config.get('nodeEnv') === 'production';
    const refreshExpiresDays: number = this.config.get('jwt.refreshExpiresDays') ?? 7;
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: refreshExpiresDays * 24 * 60 * 60 * 1000,
      path: '/auth/refresh-token',
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/auth/refresh-token' });
  }
}
