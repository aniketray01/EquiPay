import express from 'express';
import Group from '../models/Group.js';
import User from '../models/User.js';

const router = express.Router();

// Helper to populate member profiles
const populateMemberProfiles = async (group) => {
    // Ensure creator is included in the IDs we fetch profiles for
    const allMemberIds = [...new Set([...(group.members || []), group.creatorId])];

    const profiles = await User.find({
        firebaseId: { $in: allMemberIds }
    }).select('firebaseId name email avatar');

    group.memberProfiles = profiles.map(p => ({
        id: p.firebaseId,
        name: p.name,
        email: p.email,
        avatar: p.avatar
    }));
    return group;
};

// Get all groups for a user (either as creator or member)
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const groups = await Group.find({
            $or: [
                { creatorId: userId },
                { members: userId }
            ]
        }).lean();

        // Fetch profiles for all members in all found groups
        for (let i = 0; i < groups.length; i++) {
            groups[i] = await populateMemberProfiles(groups[i]);
        }
        res.json(groups);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new group
router.post('/', async (req, res) => {
    const groupData = req.body;
    const creatorId = groupData.userId || groupData.creatorId;

    if (creatorId && !groupData.creatorId) {
        groupData.creatorId = creatorId;
    }

    // Ensure creator is in the members list
    if (creatorId && !groupData.members?.includes(creatorId)) {
        groupData.members = [...(groupData.members || []), creatorId];
    }

    const group = new Group(groupData);
    try {
        let newGroup = await group.save();
        newGroup = await populateMemberProfiles(newGroup.toObject());

        // Notify all members
        newGroup.members.forEach(userId => {
            req.io.to(userId).emit('data_updated', { type: 'group_added', data: newGroup });
        });

        res.status(201).json(newGroup);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update group (add member)
router.patch('/:id', async (req, res) => {
    try {
        let updatedGroup = await Group.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).lean();

        if (updatedGroup) {
            updatedGroup = await populateMemberProfiles(updatedGroup);

            // Notify all members
            const allMemberIds = [...new Set([...(updatedGroup.members || []), updatedGroup.creatorId])];
            allMemberIds.forEach(userId => {
                req.io.to(userId).emit('data_updated', { type: 'group_updated', data: updatedGroup });
            });
        }
        res.json(updatedGroup);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete group
router.delete('/:id', async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (group) {
            const allMemberIds = [...new Set([...(group.members || []), group.creatorId])];

            await Group.findByIdAndDelete(req.params.id);

            allMemberIds.forEach(userId => {
                req.io.to(userId).emit('data_updated', { type: 'group_deleted', id: req.params.id });
            });
        }
        res.json({ message: 'Group deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
