// Setup server, session and middleware here.


import express from 'express';
import cors from 'cors';
import { startConsumer, closeConsumerConnection } from './listener/mqConsumer.js';
const app = express();

import configRoutes from './routes/index.js'

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
     origin: 'http://localhost:5173', 
     optionsSuccessStatus: 200
   };
app.use(cors(corsOptions));


configRoutes(app);

// Start the server and the consumer
const PORT = 3002; // Define port
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