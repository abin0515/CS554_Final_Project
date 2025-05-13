import { io } from 'socket.io-client'; // ✅ fix: use named import

let socket;

export async function connectSocket(currentUser) {
  if (!currentUser) return null;
  if (socket) return socket; // prevent duplicate connections

  const token = await currentUser.getIdToken();

  socket = io('http://localhost:4000', {
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
