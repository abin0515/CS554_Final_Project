import { Server } from 'socket.io';
import admin from 'firebase-admin';
import { createMessage } from '../data/messages.js';

export function initChatWebSocket(server) {
  const io = new Server(server, {
    path: '/chat-ws',
    cors: { origin: '*' },
    transports: ['websocket'],
  });

  // Firebase authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication token not provided'));
    }
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      console.error('Firebase authentication failed:', err.message);
      return next(new Error('Authentication failed'));
    }
  });

  // Socket.IO connection logic
  io.on('connection', (socket) => {
    const userId = socket.user?.uid;
    console.log(`User connected: ${userId}`);

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${userId} joined room ${roomId}`);
    });

    socket.on('send_message', async ({ from, to, text, room }) => {
      if (!text || !room || !from || !to) return;

      const message = {
        senderId: from,
        content: text,
        timestamp: new Date(),
      };

      try {
        await createMessage(room, message);
        io.to(room).emit('receive_message', message);
      } catch (err) {
        console.error('Error saving or sending message:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
}
