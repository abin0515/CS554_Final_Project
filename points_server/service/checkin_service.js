import { getRedisConnection, closeRedisConnection } from '../config/redisConnection.js';
import { handlePointsUpdate } from './points_service.js';

const redisClient = await getRedisConnection();
const CHECKIN_RECORD_KEY_PREFIX = "checkin:";


/**
 * Queries the check-in record for the user for the current month.
 * @param {string | number} userId - The ID of the user.
 * @returns {Promise<Array<0 | 1>>} An array where index corresponds to the day (0-indexed)
 *                                    and value is 1 if checked in, 0 otherwise, up to the current day.
 */
export const queryCheckinRecord = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required to query check-in records.');
    }
    const userIdStr = userId.toString();

    // 1. Generate Key for current month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const key = `${CHECKIN_RECORD_KEY_PREFIX}${userIdStr}:${year}${month}`;

    // 2. Get current day of month
    const dayOfMonth = now.getDate(); // 1-based

    try {
        // 3. Get bitmap value up to current day
        const result = await redisClient.sendCommand([
            'BITFIELD',
            key,
            'GET',
            `u${dayOfMonth}`,
            '0'
        ]);

        // 4. Handle empty result
        if (!result || !Array.isArray(result) || result.length === 0 || result[0] === null) {
            // Return an array of 0s for days up to today if no record exists
            return Array(dayOfMonth).fill(0);
        }

        const num = result[0]; // The bitmap value as a number

        // 5. Create result array and populate by checking bits
        const checkinStatus = Array(dayOfMonth).fill(0); // Initialize with 0s
        let tempNum = num; // Use a temp variable

        // Iterate from today (offset dayOfMonth-1) back to day 1 (offset 0)
        for (let offset = dayOfMonth - 1; offset >= 0; offset--) {
             // Check the bit corresponding to this offset (from the right, using the shifted value)
             if ((tempNum & 1) === 1) {
                 checkinStatus[offset] = 1;
             }
             tempNum >>>= 1; // Move to the next bit (for the previous day)
             // If tempNum becomes 0, all remaining higher bits (earlier days) are 0, so we can break early.
             if (tempNum === 0) break; 
        }
        
        // The loop above populates based on shifting num. Let's try the direct indexing approach like Java:
        // Re-initialize based on original Java logic structure for clarity
        const checkinStatusJavaStyle = Array(dayOfMonth).fill(0);
        let numJavaStyle = num;
        for (let i = dayOfMonth - 1; i >= 0; i--) {
             checkinStatusJavaStyle[i] = (numJavaStyle & 1);
             numJavaStyle >>>= 1;
        }

        // Return the result array (using the Java style implementation)
        return checkinStatusJavaStyle;

    } catch (error) {
        console.error(`Error querying check-in record for user ${userIdStr}:`, error);
        throw new Error('Failed to query check-in records.');
    }
}


/**
 * Records a check-in for the user for the current day.
 * Throws an error if the user has already checked in today.
 * @param {string | number} userId - The ID of the user checking in.
 * @returns {Promise<{ consecutiveDays: number, reward_points: number }>} Object containing consecutive days and points awarded.
 */
export const addCheckinRecord = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required for check-in.');
    }
    const userIdStr = userId.toString();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const key = `${CHECKIN_RECORD_KEY_PREFIX}${userIdStr}:${year}${month}`;
    const dayOfMonth = now.getDate(); 
    const offset = dayOfMonth - 1;

    try {
        const originalBitValue = await redisClient.setBit(key, offset, 1);
        // if (originalBitValue === 1) {
        //     throw new Error("Duplicate check-in is not allowed.");
        // }

        const consecutiveDays = await countCheckinDays(key, dayOfMonth);
        let reward_points = 0;
        switch (consecutiveDays) {
            case 7:
                reward_points = 10;
                break;
            case 14:
                reward_points = 20;
                break;
            case 28:
                reward_points = 40;
                break;
        }
        reward_points++;

        const message = {
            userId: userId,
            point: reward_points,
            timestamp: now.getTime()
        }

        const pointsRecord = await handlePointsUpdate(message, 4);
        if (!pointsRecord) {
            throw new Error('Failed to update points.');
        }

        return { consecutiveDays, reward_points};

    } catch (error) {
        console.error(`Error during check-in for user ${userIdStr}:`, error);
        if (error.message === "Duplicate check-in is not allowed.") {
            throw error;
        }
        throw new Error('Check-in failed.');
    }
};

/**
 * Counts the consecutive set bits (days checked in) from the end of the bitmap
 * up to the specified dayOfMonth.
 * @param {string} key - The Redis bitmap key (e.g., checkin:userId:yyyyMM).
 * @param {number} dayOfMonth - The current day of the month (1-based).
 * @returns {Promise<number>} The number of consecutive check-in days ending today.
 */
const countCheckinDays = async (key, dayOfMonth) => {
    try {
        const result = await redisClient.sendCommand([
            'BITFIELD',
            key,
            'GET',
            `u${dayOfMonth}`,
            '0'
        ]);

        if (!result || !Array.isArray(result) || result.length === 0) {
            return 0;
        }

        const num = result[0]; 
        if (num === null || num === undefined) { 
            return 0;
        }
        
        let count = 0;
        let tempNum = num; 
        while ((tempNum & 1) === 1) { 
            count++;
            tempNum >>>= 1; 
        }
        return count;

    } catch (error) {
        console.error(`Error counting check-in days for key ${key}:`, error);
        return 0; 
    }
};
