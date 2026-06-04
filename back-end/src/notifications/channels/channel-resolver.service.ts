import { Injectable } from '@nestjs/common';
import { Channel } from '../../common/enums';
import { INotificationChannel } from './channel.interface';
import { InAppChannel } from './inapp.channel';
import { NodemailerChannel } from './nodemailer.channel';
import { SendgridChannel } from './sendgrid.channel';

/**
 * Maps a logical channel to its ordered provider fallback chain.
 * EMAIL → [SendGrid, Nodemailer]; the worker tries each in order until one
 * succeeds. Adding a channel/provider means registering it here only — core
 * orchestration and worker code never change.
 */
@Injectable()
export class ChannelResolver {
  private readonly chains: Record<Channel, INotificationChannel[]>;

  constructor(
    sendgrid: SendgridChannel,
    nodemailer: NodemailerChannel,
    inapp: InAppChannel,
  ) {
    this.chains = {
      [Channel.EMAIL]: [sendgrid, nodemailer],
      [Channel.IN_APP]: [inapp],
      [Channel.SMS]: [], // reserved for future use
    };
  }

  /** Available providers for a channel, in fallback order. */
  resolve(channel: Channel): INotificationChannel[] {
    return (this.chains[channel] ?? []).filter((p) => p.isAvailable());
  }
}
