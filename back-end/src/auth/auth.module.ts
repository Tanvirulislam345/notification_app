import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserOrganizationMembership } from '../organizations/entities/user-organization-membership.entity';
import { Role } from '../roles/entities/role.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { SessionsModule } from '../sessions/sessions.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { MailModule } from '../mail/mail.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      Organization,
      UserOrganizationMembership,
      Role,
      EmailVerificationToken,
      PasswordResetToken,
    ]),
    SessionsModule,
    AuditLogsModule,
    MailModule,
    RolesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard, AuthService],
})
export class AuthModule {}
