import express from 'express';
import Activity from '../models/Activity.js';

const router = express.Router();

// Get activities for a specific user
router.get('/:userId', async (req, res) => {
    try {
        const activities = await Activity.find({ userId: req.params.userId })
            .sort({ date: -1 })
            .limit(50);
        res.json(activities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
