import express from 'express';
import session from 'express-session'
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { startConsumer, closeConsumerConnection } from './listener/mqConsumer.js';

import configRoutes from './routes/index.js'

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
        cookie: { maxAge: 1800000 }
    })
);
// app.use(middleware.logger);


configRoutes(app);

// Start the server and the consumer
const PORT = 3000; // Define port
const server = app.listen(PORT, () => { // Store server instance
    console.log("We've now got a server!");
    console.log(`Your routes will be running on http://localhost:${PORT}`);
    // Start the RabbitMQ consumer after the server is ready
    startConsumer().catch(error => {
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
