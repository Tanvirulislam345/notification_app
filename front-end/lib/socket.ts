import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

/**
 * Connect (once) to the Socket.IO gateway, joining the rooms for `userId`
 * (and the admin room when `isAdmin`). Reconnects with new identity if changed.
 */
export function getSocket(userId: string, isAdmin: boolean): Socket {
  if (socket && socket.io.opts.query?.userId === userId) {
    return socket;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socket = io(WS_URL, {
    query: { userId, isAdmin: String(isAdmin) },
    transports: ['websocket', 'polling'],
  });
  return socket;
}
