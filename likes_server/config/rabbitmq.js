import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://myuser:mypassword@18.188.222.62:5672/';
let channel = null;
let connection = null;

/**
 * Connects to RabbitMQ, creates a channel, asserts the exchange, 
 * and optionally asserts+binds a queue (for testing/simple setups).
 * @param {string} exchangeName The name of the exchange to assert.
 * @param {string} exchangeType The type of the exchange.
 * @param {string} [queueName] Optional: Name of the queue to assert for consuming.
 * @param {string} [bindingKey] Optional: Routing key to bind the queue with.
 */
export async function connectRabbitMQ(exchangeName = 'default_exchange', exchangeType = 'direct', queueName = null, bindingKey = null) {
    if (channel) {
        return; // Already connected
    }
    try {
        console.log(`Connecting to RabbitMQ to assert exchange '${exchangeName}' (${exchangeType})...`);
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        // 1. Assert the Exchange
        await channel.assertExchange(exchangeName, exchangeType, { durable: true });
        console.log(`Exchange '${exchangeName}' (${exchangeType}) asserted.`);

        // 2. Assert and Bind Queue (if provided)
        if (queueName) {
            await channel.assertQueue(queueName, { durable: true });
            console.log(`Queue '${queueName}' asserted.`);
            if (bindingKey !== null) { // Allow binding without a key for fanout, or with specific key
                await channel.bindQueue(queueName, exchangeName, bindingKey);
                console.log(`Queue '${queueName}' bound to exchange '${exchangeName}' with key '${bindingKey}'.`);
            }
        }
        console.log(`RabbitMQ setup complete for exchange '${exchangeName}'.`);

        connection.on('error', (err) => {
            console.error('RabbitMQ connection error:', err.message);
            channel = null;
            connection = null;
        });
        connection.on('close', () => {
            console.warn('RabbitMQ connection closed');
            channel = null;
            connection = null;
        });

    } catch (error) {
        console.error(`Failed to connect to RabbitMQ or setup structures:`, error);
        channel = null;
        connection = null;
        throw error;
    }
}

/**
 * Publishes a message to a specified RabbitMQ exchange with a routing key.
 * Ensures connection is established before publishing.
 * @param {string} exchangeName The name of the target exchange.
 * @param {string} routingKey The routing key for the message.
 * @param {object} message The message object to send (will be stringified).
 * @param {string} [exchangeType='direct'] The expected type of the exchange (used for reconnect).
 * @returns {Promise<boolean>} True if message was published successfully, false otherwise.
 */
export async function publishMessage(exchangeName, routingKey, message, exchangeType = 'direct') {
    try {
        // Ensure connection is established and exchange exists
        if (!channel) {
            console.log('RabbitMQ channel not ready, attempting to connect...');
            await connectRabbitMQ(exchangeName, exchangeType); // Attempt to connect/reconnect
        }

        if (!channel) {
            console.error('Cannot publish message, RabbitMQ channel is not available after connection attempt.');
            return false;
        }

        const messageBuffer = Buffer.from(JSON.stringify(message));
        // Publish message to the exchange with the routing key
        console.log(`Publishing message to exchange '${exchangeName}' with routing key '${routingKey}':`, message);
        const success = channel.publish(exchangeName, routingKey, messageBuffer, { persistent: true }); // Make message persistent
        
        if (!success) {
            // Handle potential backpressure - requires more complex logic with drain event
            console.warn(`Failed to publish message immediately to exchange '${exchangeName}' (buffer full?). Check drain event.`);
            // For simplicity, we return false, but a robust publisher might wait for drain
             return false;
        }
        
        console.log(`Message successfully published to exchange '${exchangeName}' with routing key '${routingKey}'.`);
        return true; // Return true on successful publish call

    } catch (error) {
        console.error(`Error publishing message to exchange '${exchangeName}' with key '${routingKey}':`, error);
        return false;
    }
}

/**
 * Gracefully closes the RabbitMQ connection and channel.
 */
export async function closeRabbitMQ() {
    console.log('Closing RabbitMQ connection...');
    try {
        if (channel) {
            await channel.close();
            channel = null;
        }
        if (connection) {
            await connection.close();
            connection = null;
        }
        console.log('RabbitMQ connection closed.');
    } catch (error) {
        console.error('Error closing RabbitMQ connection:', error);
    }
}

// Optional: Handle SIGINT for graceful shutdown if this module is run directly
// Or call closeRabbitMQ from the main application's shutdown handler
process.on('SIGINT', async () => {
    await closeRabbitMQ();
    process.exit(0);
}); 