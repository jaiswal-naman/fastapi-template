import { io } from 'socket.io-client';
import { ClientEvents, ServerEvents } from '@datacompredia/shared';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      // Vercel serves Socket.IO from the API function and only supports the WebSocket transport.
      path: '/api/socket.io',
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
}

export { ClientEvents, ServerEvents };
