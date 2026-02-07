import express from 'express';
import User from '../models/User.js';
import Friend from '../models/Friend.js';
import Expense from '../models/Expense.js';
import Group from '../models/Group.js';

const router = express.Router();

// Sync/Register user on login
router.post('/sync', async (req, res) => {
    const { firebaseId, name, email, avatar } = req.body;
    try {
        let isNewUser = false;
        let user = await User.findOne({ firebaseId });

        if (user) {
            user.name = name;
            user.avatar = avatar;
            user.email = email;
            await user.save();
        } else {
            isNewUser = true;
            user = new User({ firebaseId, name, email, avatar });
            await user.save();
        }

        // --- CONSOLIDATION LOGIC (Lazy Linking) ---
        // Find all "Ghost" friend entries that use this user's email
        const ghostFriends = await Friend.find({
            email: email.toLowerCase(),
            friendId: { $ne: firebaseId } // Find entries that haven't been linked yet
        });

        if (ghostFriends.length > 0) {
            console.log(`Consolidating data for ${email} (New ID: ${firebaseId})...`);

            for (const ghost of ghostFriends) {
                const oldId = ghost.friendId;

                // 2. Update Expenses where they are the payer or payee
                await Expense.updateMany(
                    { payerId: oldId },
                    { $set: { payerId: firebaseId } }
                );
                await Expense.updateMany(
                    { payeeId: oldId },
                    { $set: { payeeId: firebaseId } }
                );

                // 3. Update Expenses where they are in the split
                await Expense.updateMany(
                    { "splitDetails.userId": oldId },
                    { $set: { "splitDetails.$.userId": firebaseId } }
                );

                // 3. Update Groups memberships
                await Group.updateMany(
                    { members: oldId },
                    { $set: { "members.$": firebaseId } }
                );

                // 4. Finally, update the Friend record itself
                ghost.friendId = firebaseId;
                await ghost.save();
            }
        }

        res.json(user);
    } catch (err) {
        console.error("Sync/Consolidation error:", err);
        res.status(500).json({ message: err.message });
    }
});

// Search users by email or name (for adding friends)
router.get('/search', async (req, res) => {
    const { query } = req.query;
    console.log(`API: User search hit with query: ${query}`);
    try {
        const start = Date.now();
        const users = await User.find({
            $or: [
                { email: { $regex: query, $options: 'i' } },
                { name: { $regex: query, $options: 'i' } }
            ]
        }).limit(10);
        const duration = Date.now() - start;
        console.log(`API: search found ${users.length} users in ${duration}ms`);
        res.json(users);
    } catch (err) {
        console.error(`API: search error: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
});

export default router;
