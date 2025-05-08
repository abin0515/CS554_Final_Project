import { getRedisConnection, closeRedisConnection } from '../config/redisConnection.js';
import { createPoints } from '../data/points.js';


const redisClient = await getRedisConnection();
const POINTS_BOARD_PREFIX = "points:board:";


export const handlePointsUpdate = async (message, type) => {
    // Assuming message contains: { userId, point, timestamp }
    // And 'type' is the category/type of point event determining the leaderboard
    const { userId, point, timestamp } = message;
   
    // Create the point record in MongoDB first
    const pointsRecord = await createPoints(userId, type, point, timestamp);
    
    if (pointsRecord) { // Check if MongoDB record creation was successful
        const leaderboardKey = `${POINTS_BOARD_PREFIX}`;
        try {
            const newScore = await redisClient.zIncrBy(leaderboardKey, point, userId.toString()); // Ensure userId is a string for Redis member
            console.log(`Updated points for user ${userId} in leaderboard ${leaderboardKey}. New score: ${newScore}`);
        } catch (redisError) {
            console.error(`Failed to update Redis leaderboard ${leaderboardKey} for user ${userId}:`, redisError);
            // Potentially add compensating transaction logic here if Redis update fails after DB write
        }
    }
    return pointsRecord; // Return the MongoDB record
}