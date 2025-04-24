import { Router } from "express";
import { getRedisConnection } from '../config/redisConnection.js'; // Adjusted import path and function
import { addLikeRecord, getLikesStatusByBizIds } from '../service/likes_service.js';
const router = Router();

router.post('/', async (req, res) => {
    const { bizId, bizType, liked } = req.body;
     addLikeRecord(bizId, bizType, liked);
    res.status(200).json({
        success: true,
        message: 'Successfully liked/unliked post',
    });
});
router.post('/list', async (req, res) => {

   
    const bizType = req.body.bizType;
    const bizIds = req.body.bizIds;
    const result = await getLikesStatusByBizIds(bizType, bizIds);
    res.status(200).json({
        success: true,
        message: 'Successfully got liked times',
        result: result
    });
});
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