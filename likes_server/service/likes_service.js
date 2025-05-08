import { getRedisConnection, closeRedisConnection } from '../config/redisConnection.js';
import { connectRabbitMQ, publishMessage } from '../config/rabbitmq.js';
const LIKE_BIZ_KEY_PREFIX = 'likes:set:biz:';
const LIKE_COUNT_KEY_PREFIX = "likes:times:type:";
const redisClient = await getRedisConnection();

// Define exchange name and type
const EXCHANGE_NAME = 'app_events';
const EXCHANGE_TYPE = 'direct';


const LIKE_EVENT_LIKE_BINDING_KEY = 'likes.event.like'; // LIKE_EVENT_LIKE -> like/event/change post related like number
const LIKE_EVENT_POINTS_BINDING_KEY = 'likes.event.points'; // LIKE_EVENT_POINTS -> like/event/increment user points



// Ensure RabbitMQ connection, exchange, queue, and binding are setup on load
// NOTE: Queue/Binding setup should ideally be done by the consumer.
// connectRabbitMQ(EXCHANGE_NAME, EXCHANGE_TYPE, POST_QUEUE_NAME, LIKE_EVENT_LIKE_BINDING_KEY)
//     .catch(err => {
//         console.error(`Initial RabbitMQ setup failed:`, err)
//     });
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

export const addLikeRecord = async (bizId, bizType, liked, userId) => {
    

    const flag = liked ? await doLiked(bizId, userId) : await doUnliked(bizId, userId);

    // calculate liked times based on redis
    const key = `${LIKE_BIZ_KEY_PREFIX}${bizId}`;
    const likedTimes = await redisClient.sCard(key);
    const bizTypeTotalLikeKey = `${LIKE_COUNT_KEY_PREFIX}${bizType}`;
    await redisClient.hSet(bizTypeTotalLikeKey, bizId, likedTimes.toString()); // Store count as string
    
    // If the like/unlike operation changed the state, publish the original event
    if (flag) {
        
        const messagePayload2PostServer = {
            bizId: bizId,
            liked : liked ? 'true' : 'false',
            userId: userId, 
            timestamp: new Date().toISOString()
        };
        // console.log(`Attempting to publish LIKE event to exchange '${EXCHANGE_NAME}' with routing key '${routingKey}':`, messagePayload);
        const sendToPostServerSuccess = await publishMessage(EXCHANGE_NAME, LIKE_EVENT_LIKE_BINDING_KEY, messagePayload2PostServer, EXCHANGE_TYPE);
        if (!sendToPostServerSuccess) {
            console.warn(`Failed to publish like event for bizId ${bizId} to RabbitMQ.`);
        }
        
    }
    if(liked && flag){ 
        const messagePayload2PointsServer = {
            
            userId: userId, 
            point: 2,
            timestamp: new Date().toISOString()
        };
        const sendToPointsServerSuccess = await publishMessage(EXCHANGE_NAME, LIKE_EVENT_POINTS_BINDING_KEY, messagePayload2PointsServer, EXCHANGE_TYPE);
        if (!sendToPointsServerSuccess) {
            console.warn(`Failed to publish like event for bizId ${bizId} to RabbitMQ.`);
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





