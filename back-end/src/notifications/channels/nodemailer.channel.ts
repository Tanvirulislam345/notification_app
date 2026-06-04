import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { Channel } from '../../common/enums';
import {
  ChannelResult,
  DeliveryContext,
  INotificationChannel,
} from './channel.interface';

/**
 * Secondary EMAIL provider (SMTP). In dev this points at MailHog (:1025) so
 * every email is captured locally. Acts as the fallback when SendGrid fails.
 */
@Injectable()
export class NodemailerChannel implements INotificationChannel {
  readonly name = 'nodemailer';
  readonly channel = Channel.EMAIL;
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('mail.from')!;
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('mail.smtpHost'),
      port: this.config.get<number>('mail.smtpPort'),
      secure: this.config.get<boolean>('mail.smtpSecure'),
      auth: this.config.get<string>('mail.smtpUser')
        ? {
            user: this.config.get<string>('mail.smtpUser'),
            pass: this.config.get<string>('mail.smtpPassword'),
          }
        : undefined,
    });
  }

  isAvailable(): boolean {
    return true; // SMTP/MailHog is always configured in dev.
  }

  async send(ctx: DeliveryContext): Promise<ChannelResult> {
    const info = await this.transporter.sendMail({
      from: this.from,
      to: ctx.recipient,
      subject: ctx.subject ?? 'Notification',
      text: ctx.body,
      headers: { 'X-Correlation-Id': ctx.correlationId },
    });
    return { provider: this.name, messageId: info.messageId };
  }
}
