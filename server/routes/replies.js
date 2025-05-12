//validation done
import { Router } from "express";
import repliesService from "../service/replies_service.js";
import { authenticate } from "../middleware/authenticate.js";
import { isValidObjectId, isNonEmptyString } from "./validator.js";

const router = Router();

// createReply
router.post('/create', authenticate, async (req, res) => {
    try {
        const {
            post_id,
            answer_id,
            content,
            target_user_id,
            target_reply_id,
            anonymity
        } = req.body;

        const userId = req.user.uid;

        if (!isValidObjectId(post_id)) {
            return res.status(400).json({ error: "Invalid or missing post_id." });
        }
        if (answer_id !== null && answer_id !== undefined && !isValidObjectId(answer_id)) {
            return res.status(400).json({ error: "Invalid answer_id." });
        }
        if (!isNonEmptyString(content)) {
            return res.status(400).json({ error: "Reply content is required." });
        }
        if (target_user_id && typeof target_user_id !== 'string') {
            return res.status(400).json({ error: "Invalid target_user_id." });
        }
        if (target_reply_id && !isValidObjectId(target_reply_id)) {
            return res.status(400).json({ error: "Invalid target_reply_id." });
        }

        const existingReply = await repliesService.findUserReply(post_id, answer_id, userId);
        if (existingReply) {
            return res.status(400).json({ error: "You have already replied to this reply." });
        }

        if (answer_id !== null) {
            await repliesService.incrementReplyTimes(answer_id);
        }

        const newReply = await repliesService.createReply(
            post_id,
            answer_id,
            userId,
            content,
            target_user_id || null,
            target_reply_id || null,
            Boolean(anonymity)
        );

        res.status(200).json({
            success: true,
            message: 'Reply created successfully',
            reply: newReply
        });

    } catch (e) {
        console.error("Error in createReply route:", e);
        if (e.message.includes('not found') || e.message.includes('Invalid')) {
            return res.status(404).json({ error: e.message });
        } else if (e.message.includes('required')) {
            return res.status(400).json({ error: e.message });
        }
        res.status(500).json({ error: e.message || 'Failed to create reply.' });
    }
});

// Edit reply
router.put('/edit/:replyId', authenticate, async (req, res) => {
    try {
        const { replyId } = req.params;
        const { content } = req.body;
        const userId = req.user.uid;

        if (!isValidObjectId(replyId)) {
            return res.status(400).json({ error: 'Invalid reply ID.' });
        }
        if (!isNonEmptyString(content)) {
            return res.status(400).json({ error: 'Reply content is required.' });
        }

        const updatedReply = await repliesService.editReply(replyId, userId, content.trim());
        res.status(200).json({ success: true, reply: updatedReply });
    } catch (e) {
        console.error('Error editing reply:', e);
        if (e.message.includes('Unauthorized')) {
            return res.status(403).json({ error: e.message });
        }
        if (e.message.includes('not found')) {
            return res.status(404).json({ error: e.message });
        }
        res.status(500).json({ error: e.message || 'Failed to edit reply.' });
    }
});

// Get replies by Post ID
router.get('/byPost/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        if (!isValidObjectId(postId)) {
            return res.status(400).json({ success: false, error: 'Invalid Post ID parameter.' });
        }

        const replies = await repliesService.getRepliesByPostId(postId);

        res.status(200).json({
            success: true,
            replies: replies
        });

    } catch (e) {
        console.error("Error in getRepliesByPost route:", e);
        if (e.message.includes('Invalid') || e.message.includes('not found')) {
            return res.status(400).json({ success: false, error: e.message });
        }
        res.status(500).json({ success: false, error: e.message || 'Failed to fetch replies.' });
    }
});

// Get sub-replies by Post ID and Answer ID
router.get('/subReplies/:postId/:answerId', async (req, res) => {
    try {
        const { postId, answerId } = req.params;

        if (!isValidObjectId(postId) || !isValidObjectId(answerId)) {
            return res.status(400).json({ success: false, error: 'Invalid Post ID or Answer ID parameter.' });
        }

        const subReplies = await repliesService.getSubRepliesByAnswerId(postId, answerId);

        res.status(200).json({
            success: true,
            subReplies: subReplies
        });

    } catch (e) {
        console.error("Error in getSubRepliesByAnswerId route:", e);
        if (e.message.includes('Invalid')) {
            return res.status(400).json({ success: false, error: e.message });
        }
        res.status(500).json({ success: false, error: e.message || 'Failed to fetch sub-replies.' });
    }
});

export default router;
