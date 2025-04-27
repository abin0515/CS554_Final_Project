import amqp from 'amqplib';
import { handleLikesTask } from '../service/replies_service.js';
// Configuration - Ensure these match the publisher (likes_server)
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://myuser:mypassword@18.188.222.62:5672/';
const EXCHANGE_NAME = 'app_events';
const EXCHANGE_TYPE = 'direct';
const QUEUE_NAME = 'point_server_queue'; // Queue for the point server (or this main server)
const BINDING_KEY = 'likes.event.like';   // The specific key to listen for from the test endpoint

let connection = null;
let channel = null;

/**
 * Connects to RabbitMQ, asserts exchange & queue, binds queue, and starts consuming messages.
 */
export async function startConsumer() {
    try {
        console.log(`(Consumer: ${QUEUE_NAME}) Connecting to RabbitMQ at ${RABBITMQ_URL}...`);
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        console.log(`(Consumer: ${QUEUE_NAME}) Asserting exchange '${EXCHANGE_NAME}'...`);
        await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });

        console.log(`(Consumer: ${QUEUE_NAME}) Asserting queue '${QUEUE_NAME}'...`);
        await channel.assertQueue(QUEUE_NAME, { durable: true });

        console.log(`(Consumer: ${QUEUE_NAME}) Binding queue to exchange '${EXCHANGE_NAME}' with key '${BINDING_KEY}'...`);
        await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, BINDING_KEY);

        

        // Start consuming messages
        channel.consume(QUEUE_NAME, (msg) => {
            if (msg !== null) {
                try {
                    const messageContent = msg.content.toString();
                    const message = JSON.parse(messageContent);
                    console.log(`(Consumer: ${QUEUE_NAME}) Received message with key '${msg.fields.routingKey}':`, message);

                    // ** TODO: Add specific logic for point server here later **
                    handleLikesTask(message.bizId, message.userId, message.liked);  
                    // Acknowledge the message
                    channel.ack(msg);
                } catch (error) {
                    console.error(`(Consumer: ${QUEUE_NAME}) Error processing message:`, error);
                    channel.nack(msg, false, false); // Reject without requeue
                }
            }
        }, {
            noAck: false // Manual acknowledgement
        });

        connection.on('error', (err) => {
            console.error(`(Consumer: ${QUEUE_NAME}) RabbitMQ connection error:`, err.message);
            channel = null;
            connection = null;
            // Consider adding reconnect logic here
        });
        connection.on('close', () => {
            console.warn(`(Consumer: ${QUEUE_NAME}) RabbitMQ connection closed. Attempting to reconnect...`);
            channel = null;
            connection = null;
            setTimeout(startConsumer, 5000); // Simple retry
        });

    } catch (error) {
        console.error(`(Consumer: ${QUEUE_NAME}) Failed to connect or setup:`, error);
        // Retry connection after a delay
        setTimeout(startConsumer, 5000);
    }
}

/**
 * Gracefully closes the RabbitMQ connection.
 */
export async function closeConsumerConnection() {
    console.log(`(Consumer: ${QUEUE_NAME}) Closing RabbitMQ connection...`);
    try {
        if (channel) await channel.close().catch(e => console.error("Error closing channel:", e));
        if (connection) await connection.close().catch(e => console.error("Error closing connection:", e));
        channel = null;
        connection = null;
        console.log(`(Consumer: ${QUEUE_NAME}) RabbitMQ connection closed.`);
    } catch (error) {
        console.error(`(Consumer: ${QUEUE_NAME}) Error closing RabbitMQ connection:`, error);
    }
}

// Optional: Handle SIGINT for graceful shutdown 
// (better to call closeConsumerConnection from main app's shutdown)
process.on('SIGINT', async () => {
    await closeConsumerConnection();
    process.exit(0);
}); 