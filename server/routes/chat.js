import { Router } from "express";
import { processChat } from "../service/chat_service.js"; // Import the service
import { authenticate } from "../middleware/authenticate.js"; // Use named import

const router = Router();

const GENERAL_CHAT_SYSTEM_PROMPT = "You are a friendly and supportive AI assistant for MotherDuckers, a platform dedicated to mothers sharing childcare experiences and parenting advice. Your goal is to provide helpful, empathetic, and reliable information on parenting-related questions. You can also guide users on how to best share their experiences, ask questions, or write blogs within the MotherDuckers community. Be mindful that this is a space for mutual support and learning among mothers.";
const MODERATION_SYSTEM_PROMPT = "You are a content moderation assistant for a mother parenting platform. Your primary goal is to identify if the following user-generated content (which could be a new post or a reply to existing content) is malicious, harmful, or inappropriate for children, or if it violates community guidelines for a safe parenting environment. Consider topics like violence, explicit content, hate speech, bullying, promotion of dangerous acts, or anything that would be unsuitable for a platform focused on child well-being. Respond with only 'SAFE' if the content is appropriate, or 'UNSAFE: [brief reason]' if it is not, providing a brief reason why.";

router.post('/', async (req, res) => {
    /**
     * @type {{ messages: Array<{role: 'user' | 'assistant' | 'system', content: string}> }}
     */
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Field \'messages\' is required and must be a non-empty array.' });
    }

    try {
        // Call processChat, optionally with a general system prompt, uses default tools and temperature
        const assistantResponse = await processChat(messages, GENERAL_CHAT_SYSTEM_PROMPT);
        res.json({ response: assistantResponse });
    } catch (error) {
        console.error("[Route /chat] Error processing general chat:", error);
        res.status(500).json({ error: "Failed to process chat request.", details: error.message });
    }
});


// New moderation route
router.post('/submitchcek', authenticate, async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Field \'messages\' is required and must be a non-empty array.' });
    }

    // Construct a messages array for moderation
    const messagesForModeration = [{ role: "user", content: messages[messages.length - 1].content }];

    try {
        // Call processChat with the moderation system prompt, no tools, and a low temperature
        const rawModerationResponse = await processChat(
            messagesForModeration,
            MODERATION_SYSTEM_PROMPT,
            [], // No tools for moderation
            0.2 // Low temperature for more deterministic moderation output
        );

        // Parse the raw response to determine if it's safe
        let isSafe = false;
        let reason = null;

        if (rawModerationResponse) {
            if (rawModerationResponse.toUpperCase() === "SAFE") {
                isSafe = true;
            } else if (rawModerationResponse.toUpperCase().startsWith("UNSAFE:")) {
                isSafe = false;
                reason = rawModerationResponse.substring(7).trim();
            } else {
                // If the response isn't in the expected format, log it and treat as unsafe or needing review
                console.warn("[Route /chat/moderate] Unexpected moderation response format:", rawModerationResponse);
                isSafe = false; // Default to unsafe for unexpected formats
                reason = "Unexpected response format from moderation AI.";
            }
        }

        res.json({
            isSafe,
            reason,
            rawAIResponse: rawModerationResponse
        });

    } catch (error) {
        console.error("[Route /chat/moderate] Error processing moderation:", error);
        res.status(500).json({ error: "Failed to moderate text.", details: error.message });
    }
});

export default router;

