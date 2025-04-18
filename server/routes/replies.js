import { Router } from "express";
// import * as repliesService from "../service/replies_service.js"; // Incorrect import for default export
import repliesService from "../service/replies_service.js"; // Correct import for default export

const router = Router();

// createReply
router.post('/create', async (req, res) => {
    try {
        // Extract necessary data from request body
        const { post_id, user_id,content, target_user_id, target_reply_id, reply_times, liked_times, anonymity } = req.body;

      
        

        // Call the service layer to create the reply
        const newReply = await repliesService.createReply(
            post_id,
            user_id,
            content,
            target_user_id, // Pass null if not provided
            target_reply_id, // Pass null if not provided
            reply_times,
            liked_times,
            anonymity === false // Ensure boolean
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

// Add other reply routes here (e.g., GET /byPost/:postId, DELETE /:replyId)

export default router; 