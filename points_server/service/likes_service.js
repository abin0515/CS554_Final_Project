import { getRedisConnection, closeRedisConnection } from '../config/redisConnection.js';
import { connectRabbitMQ, publishMessage } from '../config/rabbitmq.js';
const LIKE_BIZ_KEY_PREFIX = 'likes:set:biz:';
const LIKE_COUNT_KEY_PREFIX = "likes:times:type:";
const redisClient = await getRedisConnection();

// Define exchange name and type
const EXCHANGE_NAME = 'app_events';
const EXCHANGE_TYPE = 'direct';

// --- Temporary setup for testing --- 
const TEST_QUEUE_NAME = 'point_server_queue';
const TEST_BINDING_KEY = 'test.event.ping';


// Ensure RabbitMQ connection, exchange, queue, and binding are setup on load
// NOTE: Queue/Binding setup should ideally be done by the consumer.
connectRabbitMQ(EXCHANGE_NAME, EXCHANGE_TYPE, TEST_QUEUE_NAME, TEST_BINDING_KEY)
    .catch(err => {
        console.error(`Initial RabbitMQ setup failed:`, err)
    });
export const getLikesStatusByBizIds = async (bizType, bizIds) => {
    const userId = '2001';// user hardcoded for now
    const result = [];
    for (const bizId of bizIds) {
        const key = `${LIKE_BIZ_KEY_PREFIX}${bizId}`;
        const isLiked = await redisClient.sIsMember(key, userId);
        if (isLiked) {
            result.push(bizId);
        }

    }
    return result;
};

export const addLikeRecord = async (bizId, bizType, liked) => {
    const userId = '2001';// user hardcoded for now

    const flag = liked ? await doLiked(bizId, userId) : await doUnliked(bizId, userId);

    // calculate liked times based on redis
    const key = `${LIKE_BIZ_KEY_PREFIX}${bizId}`;
    const likedTimes = await redisClient.sCard(key);
    const bizTypeTotalLikeKey = `${LIKE_COUNT_KEY_PREFIX}${bizType}`;
    await redisClient.hSet(bizTypeTotalLikeKey, bizId, likedTimes.toString()); // Store count as string
    
    // If the like/unlike operation changed the state, publish an event
    if (flag) {
        const routingKey = TEST_BINDING_KEY; // Use a descriptive key for actual events
        // Simpler Payload Structure:
        const messagePayload = {
            bizId: bizId,
            liked : liked ? 'true' : 'false',
            userId: userId, // Include user ID
            timestamp: new Date()
        };

        console.log(`Attempting to publish like event to exchange '${EXCHANGE_NAME}' with routing key '${routingKey}':`, messagePayload);

        const success = await publishMessage(EXCHANGE_NAME, routingKey, messagePayload, EXCHANGE_TYPE);

        if (!success) {
            console.warn(`Failed to publish like event for bizId ${bizId} to RabbitMQ.`);
            // Add further error handling if needed (e.g., add to a retry queue)
        }
    }
};

const doLiked = async (bizId, userId) => {

    const key = `${LIKE_BIZ_KEY_PREFIX}${bizId}`;
    const result = await redisClient.sIsMember(key, userId);

    const addResult = await redisClient.sAdd(key, userId);
    console.log(`Adding like for user ${userId} to biz ${bizId}. Result: ${addResult}`);
    return addResult > 0;
};

const doUnliked = async (bizId, userId) => {

    const key = `${LIKE_BIZ_KEY_PREFIX}${bizId}`;
    const result = await redisClient.sRem(key, userId);
    console.log(`Removing like for user ${userId} from biz ${bizId}. Result: ${result}`);
    return result > 0;
};





