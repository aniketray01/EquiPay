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

        // Find which member IDs did not have registered user profiles
        const fetchedNetworkIds = new Set(networkProfiles.map(p => String(p.firebaseId)));
        const missingNetworkIds = allMemberIds.filter(id => id && !fetchedNetworkIds.has(String(id)));

        let ghostNetworkProfiles = [];
        if (missingNetworkIds.length > 0) {
            ghostNetworkProfiles = await Friend.find({
                friendId: { $in: missingNetworkIds }
            });
        }

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

        // Map network friends (including ghost network profiles)
        const networkWithProfiles = [
            ...networkProfiles.map(p => ({
                id: p.firebaseId,
                name: p.name,
                email: p.email,
                avatar: p.avatar,
                isNetwork: true
            })),
            ...ghostNetworkProfiles.map(f => ({
                id: f.friendId,
                name: f.name,
                email: f.email,
                avatar: null,
                isNetwork: true,
                isGhost: true
            }))
        ];

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
// Update a friend
router.put('/:userId/:friendId', async (req, res) => {
    try {
        const { userId, friendId } = req.params;
        const { name, email } = req.body;

        const friend = await Friend.findOne({ userId, friendId });
        if (!friend) {
            return res.status(404).json({ message: 'Friend record not found' });
        }

        if (name) friend.name = name;
        
        let newEmail = friend.email;
        if (email) {
            newEmail = email.toLowerCase().trim();
            friend.email = newEmail;
        }

        // Check if there is an existing user registered with this new email
        const existingUser = await User.findOne({ email: newEmail });
        const oldFriendId = friend.friendId;
        
        if (existingUser && oldFriendId !== existingUser.firebaseId) {
            const newFriendId = existingUser.firebaseId;
            console.log(`Email updated to registered user. Consolidating ghost ID ${oldFriendId} to ${newFriendId}...`);

            // Consolidate expenses
            await Expense.updateMany({ payerId: oldFriendId }, { $set: { payerId: newFriendId } });
            await Expense.updateMany({ payeeId: oldFriendId }, { $set: { payeeId: newFriendId } });
            await Expense.updateMany({ "splitDetails.userId": oldFriendId }, { $set: { "splitDetails.$.userId": newFriendId } });

            // Consolidate group memberships
            await Group.updateMany({ members: oldFriendId }, { $set: { "members.$": newFriendId } });

            // Update the Friend record's friendId
            friend.friendId = newFriendId;
        }

        await friend.save();

        // Notify via sockets
        req.io.to(userId).emit('data_updated', { type: 'friend_updated', data: friend });
        req.io.to(oldFriendId).emit('data_updated', { type: 'friend_updated', id: oldFriendId });
        if (existingUser) {
            req.io.to(existingUser.firebaseId).emit('data_updated', { type: 'friend_updated', id: existingUser.firebaseId });
        }

        // Log Activity
        const actor = await User.findOne({ firebaseId: userId });
        const actorName = actor ? actor.name : 'Someone';
        await new Activity({
            userId,
            actorId: userId,
            actorName,
            type: 'friend_updated',
            description: `You updated information for ${friend.name}`,
            metadata: { friendId: friend.friendId }
        }).save();

        res.json(friend);
    } catch (err) {
        console.error('API: Error updating friend:', err);
        res.status(500).json({ message: err.message });
    }
});

export default router;
