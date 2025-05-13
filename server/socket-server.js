import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createMessage } from './data/messages.js';
import { serviceAccount } from './middleware/authenticate.js';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
app.use(cors({ origin: '*' }));

// Initialize Socket.IO server
const io = new Server(server, {
  cors: { origin: '*' },
  transports: ['websocket'],
});

// Firebase authentication middleware
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

// Start server
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Socket.IO server is running at http://localhost:${PORT}`);
});
