import { io } from 'socket.io-client';

let socket;

export async function connectSocket(currentUser) {
  if (!currentUser) return null;
  if (socket) return socket; // prevent duplicate connections

  const token = await currentUser.getIdToken();

  socket = io('http://localhost:3000', {
    path: '/chat-ws', // new endpoint path
    auth: {
      token,
    },
    transports: ['websocket'],
  });

  // Log connection errors
  socket.on('connect_error', (err) => {
    console.error('❌ Socket connection failed:', err.message);
  });

  return socket;
}

export function getSocket() {
  return socket;
}
