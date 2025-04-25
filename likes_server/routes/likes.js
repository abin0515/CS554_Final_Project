import { Router } from "express";
import { getRedisConnection } from '../config/redisConnection.js';
import { addLikeRecord, getLikesStatusByBizIds } from '../service/likes_service.js';
import { connectRabbitMQ, publishMessage } from '../config/rabbitmq.js';

// Define exchange name and type
const EXCHANGE_NAME = 'app_events';
const EXCHANGE_TYPE = 'direct';

// --- Temporary setup for testing --- 
const TEST_QUEUE_NAME = 'point_server_queue';
const TEST_BINDING_KEY = 'likes.event.like';


// Ensure RabbitMQ connection, exchange, queue, and binding are setup on load
// NOTE: Queue/Binding setup should ideally be done by the consumer.
connectRabbitMQ(EXCHANGE_NAME, EXCHANGE_TYPE, TEST_QUEUE_NAME, TEST_BINDING_KEY)
    .catch(err => {
        console.error(`Initial RabbitMQ setup failed:`, err)
    });
const router = Router();



// --- End Temporary setup ---


// POST / - Handle Like/Unlike (Original logic)
router.post('/', async (req, res) => {
    const { bizId, bizType, liked } = req.body;
    try {
        // Assuming addLikeRecord is synchronous for now or doesn't need await here
        // If addLikeRecord becomes async and needs handling, adjust this.
        addLikeRecord(bizId, bizType, liked);
        res.status(200).json({
            success: true,
            message: 'Successfully updated like status', // Keep updated message or revert if preferred
        });
    } catch (error) {
        console.error(`Error processing like for ${bizId} (${bizType}):`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to process like/unlike action.',
            error: error.message
        });
    }
});

// POST /list - Fetch initial liked statuses
router.post('/list', async (req, res) => {
    const { bizType, bizIds } = req.body;
    // Assuming userId is hardcoded in service as per previous state
    if (!bizType || !Array.isArray(bizIds) || bizIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Missing or invalid parameters: bizType and bizIds (array) are required.'
        });
    }
    try {
        const result = await getLikesStatusByBizIds(bizType, bizIds);
        res.status(200).json({
            success: true,
            message: 'Successfully retrieved liked statuses for user',
            result: result
        });
    } catch (error) {
        console.error(`Error fetching like statuses for type ${bizType}:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve liked statuses due to server error.',
            error: error.message
        });
    }
});

// --- Updated Test MQ Endpoint ---
router.post('/test-mq', async (req, res) => {
    // Use the specific test routing key for publishing
    const routingKey = TEST_BINDING_KEY; // Use the key we bound the queue with
    const testMessage = `Test message from /test-mq with key ${routingKey}`;
    const messagePayload = { message: testMessage, timestamp: new Date() };

    console.log(`Attempting to publish test message to exchange '${EXCHANGE_NAME}' with routing key '${routingKey}':`, messagePayload);
    
    const success = await publishMessage(EXCHANGE_NAME, routingKey, messagePayload, EXCHANGE_TYPE);

    if (success) {
        res.status(200).json({ success: true, message: `Message published to exchange '${EXCHANGE_NAME}' with key '${routingKey}' (Queue '${TEST_QUEUE_NAME}' should receive it)` });
    } else {
        res.status(500).json({ success: false, message: `Failed to publish message to exchange '${EXCHANGE_NAME}'` });
    }
});
// --- End Test MQ Endpoint ---

// Test Route for Redis Connection
router.get('/test-redis-connection', async (req, res) => {
  console.log('Attempting to test Redis connection...');
  let redisClient; // Define variable to hold the client
  try {
    redisClient = await getRedisConnection(); // Get the Redis client instance
    // Send a PING command to Redis
    const reply = await redisClient.ping();
    console.log('Redis PING response:', reply);

    if (reply === 'PONG') {
      res.status(200).json({ 
        success: true, 
        message: 'Successfully connected to Redis and received PONG!' 
      });
    } else {
      // Should not happen if ping() resolves, but good practice
      res.status(500).json({ 
        success: false, 
        error: 'Received unexpected response from Redis PING',
        response: reply
      });
    }
  } catch (e) {
    console.error("Redis connection test failed:", e);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to connect to Redis or execute PING command.', 
      details: e.message 
    });
  } 
  // Note: We might not want to close the connection here if it's shared
  // await closeRedisConnection(); // Consider connection management strategy
});

export default router;