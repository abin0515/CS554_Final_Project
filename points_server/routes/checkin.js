import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { addCheckinRecord, queryCheckinRecord } from '../service/checkin_service.js';

const router = Router();

// Authenticated route: Gets user-specific rank/score + board
router.post('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.uid;
        const checkinData = await addCheckinRecord(userId);
        res.json(checkinData);
    } catch (error) {
        console.error("Error in POST /checkin:", error);
        if (error.message === "Duplicate check-in is not allowed.") {
             res.status(409).json({ error: error.message });
        } else {
             res.status(500).json({ error: error.message || 'Failed to add checkin record' });
        }
    }
});

router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.uid;
        const checkinRecords = await queryCheckinRecord(userId);
        res.json(checkinRecords);
    } catch (error) {
        console.error("Error in GET /checkin:", error);
        res.status(500).json({ error: error.message || 'Failed to query checkin records' });
    }
});


export default router;