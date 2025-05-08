import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getBoard } from '../service/board_service.js';

const router = Router();

// Authenticated route: Gets user-specific rank/score + board
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.uid;
        const boardData = await getBoard(userId);
        res.json(boardData);
    } catch (error) {
        console.error("Error in GET /board:", error);
        res.status(500).json({ error: error.message || 'Failed to fetch leaderboard data' });
    }
});

// Unauthenticated route: Gets only the general board data
router.get('/noAuth', async (req, res) => {
    try {
        // Call getBoard without userId to get only the general board
        const boardData = await getBoard(); // Passing no userId or null
        res.json(boardData);
    } catch (error) {
        console.error("Error in GET /board/noAuth:", error);
        res.status(500).json({ error: error.message || 'Failed to fetch leaderboard data' });
    }
});

export default router;