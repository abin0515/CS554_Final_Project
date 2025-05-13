import express from 'express';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import configRoutes from './routes/index.js';
import { startConsumer, closeConsumerConnection } from './listener/mqConsumer.js';
import { serviceAccount } from './middleware/authenticate.js';
import { initChatWebSocket } from './service/chat_websocket.js';

const app = express();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use CORS middleware
app.use(cors()); // Allows all origins by default

// Static files middleware - Serve files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// This will make http://localhost:3000/uploads/posts/your-image.jpg work

// If you want requests to /images/your-image.jpg to map to /public/uploads/posts/your-image.jpg:
// app.use('/images', express.static(path.join(__dirname, 'public/uploads/posts')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    name: 'FinalProject',
    secret: "This is a secret",
    saveUninitialized: false,
    resave: false,
    cookie: { maxAge: 1800000 },
  })
);
// app.use(middleware.logger);

// Setup routes
configRoutes(app);

// Create the HTTP server from the Express app
const server = http.createServer(app);

// Initialize Socket.IO using your external module
initChatWebSocket(server);

// Start the HTTP server
const PORT = 3000;
server.listen(PORT, () => {
  console.log("We've now got a server!");
  console.log(`Your routes are running on http://localhost:${PORT}`);
  console.log(`Socket.IO endpoint is available at http://localhost:${PORT}/chat-ws`);
  // Start RabbitMQ consumer after the server is ready
  startConsumer().catch((error) => {
    console.error("Failed to start RabbitMQ consumer initially:", error);
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\nReceived kill signal, shutting down gracefully...');
  server.close(async () => { // Stop accepting new HTTP connections
    console.log('Closed out remaining HTTP connections.');
    await closeConsumerConnection(); // Close RabbitMQ connection
    // Add any other cleanup here
    process.exit(0);
  });

  // Force shutdown if server hasn't finished in time
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000); // 10 seconds timeout
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown); // Handle Ctrl+C
