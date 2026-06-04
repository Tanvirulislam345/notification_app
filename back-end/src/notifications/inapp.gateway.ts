import { Inject } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';
import { AppLogger } from '../common/logger.service';
import { REDIS_CLIENT } from '../common/redis.module';

export interface InAppPayload {
  id: string;
  body: string;
  correlationId: string;
  createdAt: string;
}

/**
 * Real-time in-app push over Socket.IO. The Redis adapter fans events out
 * across every horizontally-scaled instance, so a client connected to node A
 * receives events emitted from node B.
 *
 * Rooms: `user:<userId>` per user, plus a shared `admins` room.
 * Dev auth stub: the client passes `userId` (+ optional `isAdmin`) in the
 * connection handshake query.
 */
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class InAppGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly logger: AppLogger,
  ) {}

  afterInit(server: Server) {
    const pubClient = this.redis.duplicate();
    const subClient = this.redis.duplicate();
    server.adapter(createAdapter(pubClient, subClient));
    this.logger.event('socket.io gateway initialised with Redis adapter');
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string | undefined;
    const isAdmin = client.handshake.query.isAdmin === 'true';
    if (userId) {
      client.join(`user:${userId}`);
    }
    if (isAdmin) {
      client.join('admins');
    }
  }

  emitToUser(userId: string, payload: InAppPayload) {
    this.server.to(`user:${userId}`).emit('notification', payload);
  }

  emitToAdmins(payload: InAppPayload) {
    this.server.to('admins').emit('notification', payload);
  }
}
