import { Router } from "express";
// import * as repliesService from "../service/replies_service.js"; // Incorrect import for default export
import repliesService from "../service/replies_service.js"; // Correct import for default export
import { authenticate } from "../middleware/authenticate.js";


const router = Router();

// createReply
router.post('/create', authenticate, async (req, res) => {
    try {
        // Extract necessary data from request body
        // Include answer_id, adjust parameter names to match frontend/common usage
        const {
            post_id,
            answer_id, // ID of the top-level reply (null if direct reply to post
            content,
            target_user_id, // User ID being replied to (often the author of parent_reply_id)
            target_reply_id, // ID of the immediate parent reply (null if direct reply to post)
            anonymity
        } = req.body;

        const userId = req.user.uid;

        // Validation: Only one reply per user per post/reply
        const existingReply = await repliesService.findUserReply(post_id, answer_id, userId);
        if (existingReply) {
            return res.status(400).json({ error: "You have already replied to this post/reply." });
        }

        if(answer_id !== null){
            // if answer_id is not null, then we need to increment the reply_times of the the answer_id
            await repliesService.incrementReplyTimes(answer_id);
        }
        // Call the service layer to create the reply
        const newReply = await repliesService.createReply(
            post_id,
            answer_id,
            userId,
            content,
            target_user_id, // Pass null if not provided
            target_reply_id, // Pass null if not provided

            anonymity // Ensure boolean
        );

        res.status(200).json({
            success: true,
            message: 'Reply created successfully',
            reply: newReply
        });

    } catch (e) {
        console.error("Error in createReply route:", e);
        // Handle specific errors from the service layer
        if (e.message.includes('not found') || e.message.includes('Invalid')) {
            return res.status(404).json({ error: e.message });
        } else if (e.message.includes('required')) {
             return res.status(400).json({ error: e.message });
        }
        // General error
        res.status(500).json({ error: e.message || 'Failed to create reply.' });
    }
});

// Get replies by Post ID
router.get('/byPost/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        // Basic validation in route before hitting service
        if (!postId || typeof postId !== 'string') {
             return res.status(400).json({ success: false, error: 'Invalid or missing Post ID parameter.' });
        }

        // Call the service layer to get replies
        const replies = await repliesService.getRepliesByPostId(postId);

        res.status(200).json({
            success: true,
            replies: replies // This will be an array (potentially empty)
        });

    } catch (e) {
        console.error("Error in getRepliesByPost route:", e);
        // Handle specific errors (like invalid ID format from service/data layers)
        if (e.message.includes('Invalid') || e.message.includes('not found')) { // Catch validation errors
            return res.status(400).json({ success: false, error: e.message });
        }
        // General error
        res.status(500).json({ success: false, error: e.message || 'Failed to fetch replies.' });
    }
});

// Get sub-replies by Post ID and Answer ID
router.get('/subReplies/:postId/:answerId', async (req, res) => {
    try {
        const { postId, answerId } = req.params;

        // Basic validation (more thorough validation in service layer)
        if (!postId || !answerId) {
             return res.status(400).json({ success: false, error: 'Missing Post ID or Answer ID parameter.' });
        }

        // Call the service layer to get sub-replies
        const subReplies = await repliesService.getSubRepliesByAnswerId(postId, answerId);

        res.status(200).json({
            success: true,
            subReplies: subReplies // This will be an array (potentially empty)
        });

    } catch (e) {
        console.error("Error in getSubRepliesByAnswerId route:", e);
        // Handle specific errors (like invalid ID format from service/data layers)
        if (e.message.includes('Invalid')) { // Catch validation errors
            return res.status(400).json({ success: false, error: e.message });
        }
        // General error
        res.status(500).json({ success: false, error: e.message || 'Failed to fetch sub-replies.' });
    }
});

// Add other reply routes here (e.g., DELETE /:replyId)

export default router;
