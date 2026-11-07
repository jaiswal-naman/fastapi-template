import { io } from 'socket.io-client';
import { ClientEvents, ServerEvents } from '@datacompredia/shared';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}

export { ClientEvents, ServerEvents };
