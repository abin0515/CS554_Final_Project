import { getRedisConnection, closeRedisConnection } from '../config/redisConnection.js';

const redisClient = await getRedisConnection();

const POINTS_BOARD_KEY = "points:board:"; // Using a clear name for the specific key

export const getBoard = async (userId = null) => {
    let currentUserRank = null;
    let currentUserScore = null;

    try {
        // Fetch current user's data only if userId is provided
        if (userId) {
            const userIdStr = userId.toString(); // Ensure userId is a string for Redis operations

            // Get current user's rank (0-indexed, so add 1 for 1-based rank)
            const userRank0Indexed = await redisClient.zRevRank(POINTS_BOARD_KEY, userIdStr);
            currentUserRank = userRank0Indexed !== null ? userRank0Indexed + 1 : null;

            // Get current user's score
            const currentUserScoreStr = await redisClient.zScore(POINTS_BOARD_KEY, userIdStr);
            currentUserScore = currentUserScoreStr !== null ? parseFloat(currentUserScoreStr) : null;
        }

        // Get the top players using zRange with WITHSCORES option
        const boardDataWithScoresArray = await redisClient.sendCommand([
            'ZRANGE', 
            POINTS_BOARD_KEY, 
            '0', '-1', 
            'REV', 
            'WITHSCORES'
        ]);
        
        const formattedBoard = [];
        if (boardDataWithScoresArray && boardDataWithScoresArray.length > 0) {
            for (let i = 0; i < boardDataWithScoresArray.length; i += 2) {
                const memberUserId = boardDataWithScoresArray[i];
                const memberScore = parseFloat(boardDataWithScoresArray[i + 1]);
                formattedBoard.push({
                    rank: (i / 2) + 1, 
                    name: memberUserId, 
                    points: memberScore,
                });
            }
        }

        // Always return the structured object
        return {
            rank: currentUserRank,    // Will be null if userId was not provided
            points: currentUserScore, // Will be null if userId was not provided
            board: formattedBoard,
        };

    } catch (error) {
        console.error(`Error getting board (userId: ${userId}):`, error);
        throw error; // Re-throw the error after logging
    }
};