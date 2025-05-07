import { Router } from "express";
import { getRedisConnection } from '../config/redisConnection.js';
import { addLikeRecord, getLikesStatusByBizIds } from '../service/likes_service.js';
import { connectRabbitMQ, publishMessage } from '../config/rabbitmq.js';




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



export default router;