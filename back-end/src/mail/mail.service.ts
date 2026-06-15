import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('mail.smtpHost'),
      port: this.config.get<number>('mail.smtpPort'),
      secure: this.config.get<boolean>('mail.smtpSecure'),
      auth: this.config.get<string>('mail.smtpUser')
        ? { user: this.config.get<string>('mail.smtpUser'), pass: this.config.get<string>('mail.smtpPassword') }
        : undefined,
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const appUrl = this.config.get<string>('appUrl');
    const link = `${appUrl}/verify-email?token=${token}`;
    await this.transporter.sendMail({
      from: this.config.get<string>('mail.from'),
      to,
      subject: 'Verify your email address',
      html: `<p>Click to verify your email: <a href="${link}">${link}</a></p><p>Link expires in 24 hours.</p>`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const appUrl = this.config.get<string>('appUrl');
    const link = `${appUrl}/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: this.config.get<string>('mail.from'),
      to,
      subject: 'Reset your password',
      html: `<p>Click to reset your password: <a href="${link}">${link}</a></p><p>Link expires in 1 hour.</p>`,
    });
  }

  async sendInvitationEmail(to: string, organizationName: string, token: string): Promise<void> {
    const appUrl = this.config.get<string>('appUrl');
    const link = `${appUrl}/invitations/accept?token=${token}`;
    await this.transporter.sendMail({
      from: this.config.get<string>('mail.from'),
      to,
      subject: `You are invited to join ${organizationName}`,
      html: `<p>You have been invited to join <strong>${organizationName}</strong>.</p><p><a href="${link}">Accept Invitation</a></p>`,
    });
  }
}
