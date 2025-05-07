import { getRedisConnection, closeRedisConnection } from '../config/redisConnection.js';
import { createPoints } from '../data/points.js';






export const handlePointsUpdate = async (message, type) => {
    const {  userId, point, timestamp } = message;
   
    const points = await createPoints(userId, type, point, timestamp);
    return points;
}