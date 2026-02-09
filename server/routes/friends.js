import express from 'express';
import Friend from '../models/Friend.js';
import mongoose from 'mongoose';
import Activity from '../models/Activity.js';

const router = express.Router();

import User from '../models/User.js';
import Group from '../models/Group.js';
import Expense from '../models/Expense.js';

// Get all friends for a user (Manual + Network)
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // 1. Manual Friends (bookmarks)
        const manualFriends = await Friend.find({ userId });

        // 2. Group Friends
        const userGroups = await Group.find({ members: userId });
        const groupMemberIds = userGroups.flatMap(g => g.members);

        // 3. Shared Expense Friends
        const userExpenses = await Expense.find({
            $or: [
                { creatorId: userId },
                { payerId: userId },
                { payeeId: userId },
                { 'splitDetails.userId': userId }
            ]
        });
        const expenseMemberIds = userExpenses.flatMap(e => [
            e.payerId,
            e.payeeId,
            ...(e.splitDetails?.map(s => s.userId) || [])
        ]);

        const allMemberIds = [...new Set([...groupMemberIds, ...expenseMemberIds])]
            .filter(id => id && id !== userId);

        // 4. Added-Me Friends (Reverse Bookmarks)
        // People who have this user in their friends list
        const addedMeFriends = await Friend.find({ friendId: userId });
        const addedMeUserIds = addedMeFriends.map(f => f.userId);

        // 5. Fetch User profiles for all involved people + manual friends + reverse friends
        const [manualProfiles, networkProfiles, addedMeProfiles] = await Promise.all([
            User.find({ firebaseId: { $in: manualFriends.map(f => f.friendId) } }),
            User.find({ firebaseId: { $in: allMemberIds } }),
            User.find({ firebaseId: { $in: addedMeUserIds } })
        ]);

        // Map manual friends to include profile info if available
        const manualWithProfiles = manualFriends.map(f => {
            const profile = manualProfiles.find(p => p.firebaseId === f.friendId);
            return {
                id: f.friendId,
                name: profile?.name || f.name,
                email: profile?.email || f.email,
                avatar: profile?.avatar,
                isManual: true
            };
        });

        // Map network friends
        const networkWithProfiles = networkProfiles.map(p => ({
            id: p.firebaseId,
            name: p.name,
            email: p.email,
            avatar: p.avatar,
            isNetwork: true
        }));

        // Map reverse friends (People who added the current user)
        const addedMeWithProfiles = addedMeProfiles.map(p => ({
            id: p.firebaseId,
            name: p.name,
            email: p.email,
            avatar: p.avatar,
            isAddedMe: true, // Special flag
            isMutual: true // Marker for UI
        }));

        // Merge and remove duplicates (preserve all flags)
        const friendsMap = new Map();

        // 1. Add Network friends first
        networkWithProfiles.forEach(f => friendsMap.set(f.id, { ...f }));

        // 2. Merge added-me (reverse) friends
        addedMeWithProfiles.forEach(f => {
            const existing = friendsMap.get(f.id) || {};
            friendsMap.set(f.id, { ...existing, ...f });
        });

        // 3. Merge manual friends last (manual info is highest priority for name/email)
        manualWithProfiles.forEach(f => {
            const existing = friendsMap.get(f.id) || {};
            friendsMap.set(f.id, { ...existing, ...f });
        });

        res.json(Array.from(friendsMap.values()));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a friend
router.post('/', async (req, res) => {
    console.log('API: POST /api/friends hit', req.body);

    if (mongoose.connection.readyState !== 1) {
        console.error('API: Database not connected. State:', mongoose.connection.readyState);
        return res.status(503).json({ message: 'Database not ready' });
    }

    const friendData = req.body;
    // Map 'id' from frontend/localStorage to 'friendId' for MongoDB
    if (friendData.id && !friendData.friendId) {
        friendData.friendId = friendData.id;
    }
    // If neither is present, generate one
    if (!friendData.friendId) {
        friendData.friendId = `f${Date.now()}`;
    }

    const friend = new Friend(friendData);
    try {
        console.log('API: Saving friend to DB...');
        const newFriend = await friend.save();
        console.log('API: Friend saved successfully');

        // Notify both users
        req.io.to(newFriend.userId).emit('data_updated', { type: 'friend_added', data: newFriend });
        req.io.to(newFriend.friendId).emit('data_updated', { type: 'friend_added', data: newFriend });

        const actor = await User.findOne({ firebaseId: newFriend.userId });
        const actorName = actor ? actor.name : 'Someone';

        // Log for Adder
        await new Activity({
            userId: newFriend.userId,
            actorId: newFriend.userId,
            actorName,
            type: 'friend_added',
            description: `You added ${newFriend.name} as a friend`,
            metadata: { friendId: newFriend.friendId }
        }).save();

        // Log for Added
        await new Activity({
            userId: newFriend.friendId,
            actorId: newFriend.userId,
            actorName,
            type: 'friend_added',
            description: `${actorName} added you as a friend`,
            metadata: { friendId: newFriend.userId }
        }).save();

        res.status(201).json(newFriend);
    } catch (err) {
        console.error('API: Error saving friend:', err.message);
        res.status(400).json({ message: err.message });
    }
});

// Remove a friend
router.delete('/:userId/:friendId', async (req, res) => {
    try {
        const { userId, friendId } = req.params;
        console.log(`API: Removing friend relationship between ${userId} and ${friendId}`);

        // Delete manual bookmark from either side
        const result = await Friend.deleteMany({
            $or: [
                { userId, friendId },
                { userId: friendId, friendId: userId }
            ]
        });

        console.log(`API: Deleted ${result.deletedCount} manual friend records`);

        // Notify both users via socket
        req.io.to(userId).emit('data_updated', { type: 'friend_removed', id: friendId });
        req.io.to(friendId).emit('data_updated', { type: 'friend_removed', id: userId });

        res.json({ message: 'Friend relationship removed', deletedCount: result.deletedCount });
    } catch (err) {
        console.error('API: Error removing friend:', err);
        res.status(500).json({ message: err.message });
    }
});

export default router;
