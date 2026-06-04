import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import { Channel } from '../../common/enums';
import {
  ChannelResult,
  DeliveryContext,
  INotificationChannel,
} from './channel.interface';

/**
 * Primary EMAIL provider. Only available when SENDGRID_API_KEY is set;
 * otherwise the resolver skips it and falls back to Nodemailer.
 */
@Injectable()
export class SendgridChannel implements INotificationChannel {
  readonly name = 'sendgrid';
  readonly channel = Channel.EMAIL;
  private readonly apiKey?: string;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('mail.sendgridApiKey');
    this.from = this.config.get<string>('mail.from')!;
    if (this.apiKey) {
      sgMail.setApiKey(this.apiKey);
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async send(ctx: DeliveryContext): Promise<ChannelResult> {
    const [res] = await sgMail.send({
      to: ctx.recipient,
      from: this.from,
      subject: ctx.subject ?? 'Notification',
      text: ctx.body,
      customArgs: { correlationId: ctx.correlationId },
    });
    return {
      provider: this.name,
      messageId: res?.headers?.['x-message-id'] as string | undefined,
    };
  }
}
