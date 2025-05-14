import amqp from 'amqplib';
// import { handleLikesTask } from '../service/replies_service.js';
import { handlePointsUpdate } from '../service/points_service.js'; // Placeholder for actual points task handler


// Configuration - Ensure these match the publisher (likes_server)
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://myuser:mypassword@localhost:5672/';
const EXCHANGE_NAME = 'app_events';
const EXCHANGE_TYPE = 'direct';
const QUEUE_NAME = 'points_server_queue'; // Queue for the point server (or this main server)

const LIKES_EVENT_POINTS_BINDING_KEY = 'likes.event.points';  // likes/event/increment user points
const REPLIES_EVENT_POINTS_BINDING_KEY = 'replies.event.points'; // replies/event/increment user points
const POST_EVENT_POINTS_BINDING_KEY = 'posts.event.points'; // posts/event/increment user points
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

        console.log(`(Consumer: ${QUEUE_NAME}) Binding queue to exchange '${EXCHANGE_NAME}' with key '${LIKES_EVENT_POINTS_BINDING_KEY}'...`);
        await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, LIKES_EVENT_POINTS_BINDING_KEY);
        await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, REPLIES_EVENT_POINTS_BINDING_KEY);
        await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, POST_EVENT_POINTS_BINDING_KEY);


        console.log(`(Consumer: ${QUEUE_NAME}) Waiting for messages...`);

        channel.consume(QUEUE_NAME, async (msg) => {
            if (msg !== null) {
                try {
                    const messageContent = msg.content.toString();
                    const message = JSON.parse(messageContent);
                    console.log(`(Consumer: ${QUEUE_NAME}) Received message with routing key '${msg.fields.routingKey}':`, message);

                    // Dispatch based on routing key
                    // type 1: likes.event.points
                    switch (msg.fields.routingKey) {
                        case LIKES_EVENT_POINTS_BINDING_KEY:
                            //  type 1 for likes event
                            await handlePointsUpdate(message, 1);
                            break;
                        case REPLIES_EVENT_POINTS_BINDING_KEY:
                            //  type 2 for replies event
                            await handlePointsUpdate(message, 2);
                            break;
                        case POST_EVENT_POINTS_BINDING_KEY:
                            //  type 3 for posts event
                            await handlePointsUpdate(message, 3);
                            break;
                        default:
                            console.warn(`(Consumer: ${QUEUE_NAME}) Received message with unknown routing key: ${msg.fields.routingKey}`);
                            // Decide if you want to ack, nack, or ignore
                            break;
                    }
                    channel.ack(msg);
                } catch (error) {
                    console.error(`(Consumer: ${QUEUE_NAME}) Error processing message:`, error, msg.content.toString());
                    channel.nack(msg, false, false); // Reject without requeue for parse/handler errors
                }
            }
        }, {
            noAck: false
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
