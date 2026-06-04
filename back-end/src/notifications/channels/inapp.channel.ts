import { Injectable } from '@nestjs/common';
import { Channel } from '../../common/enums';
import { InAppGateway } from '../inapp.gateway';
import {
  ChannelResult,
  DeliveryContext,
  INotificationChannel,
} from './channel.interface';

/** IN_APP provider — pushes the notification to the recipient via Socket.IO. */
@Injectable()
export class InAppChannel implements INotificationChannel {
  readonly name = 'inapp';
  readonly channel = Channel.IN_APP;

  constructor(private readonly gateway: InAppGateway) {}

  isAvailable(): boolean {
    return true;
  }

  async send(ctx: DeliveryContext): Promise<ChannelResult> {
    const payload = {
      id: ctx.logId,
      body: ctx.body,
      correlationId: ctx.correlationId,
      createdAt: new Date().toISOString(),
    };
    // Admin bulk-action notifications go to the shared admins room; everything
    // else targets the specific recipient's room.
    if (ctx.isAdmin) {
      this.gateway.emitToAdmins(payload);
    } else {
      this.gateway.emitToUser(ctx.userId, payload);
    }
    return { provider: this.name };
  }
}
