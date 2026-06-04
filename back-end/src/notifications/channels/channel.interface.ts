import { Channel } from '../../common/enums';

/** Everything a channel adapter needs to deliver one notification. */
export interface DeliveryContext {
  logId: string;
  userId: string;
  correlationId: string;
  recipient: string;
  subject?: string;
  body: string;
  isAdmin?: boolean;
}

export interface ChannelResult {
  /** Provider that handled the send (for metrics / logs), e.g. `sendgrid`. */
  provider: string;
  /** Provider-specific id, when available. */
  messageId?: string;
}

/**
 * Adapter contract every delivery provider implements. Core logic depends only
 * on this interface, so new channels/providers are added without touching it.
 */
export interface INotificationChannel {
  /** Provider name, e.g. `sendgrid`, `nodemailer`, `inapp`. */
  readonly name: string;
  /** The logical channel this provider serves. */
  readonly channel: Channel;
  /** True when the provider is configured and usable in this environment. */
  isAvailable(): boolean;
  /** Deliver the message. Throws on failure so the worker can retry. */
  send(ctx: DeliveryContext): Promise<ChannelResult>;
}

/** DI token for the ordered list of channel providers. */
export const CHANNEL_PROVIDERS = 'CHANNEL_PROVIDERS';
