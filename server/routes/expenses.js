import express from 'express';
import Expense from '../models/Expense.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import Group from '../models/Group.js';

const router = express.Router();

// Get all expenses for a user (either as creator, payer, participant, or group member)
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Find all groups where the user is a member or creator
        const userGroups = await Group.find({
            $or: [
                { creatorId: userId },
                { members: userId }
            ]
        }).select('_id members creatorId');

        const groupIds = userGroups.map(g => g._id);

        // Collect all IDs of people the user shares any group with
        const allGroupMemberIds = new Set();
        userGroups.forEach(g => {
            g.members.forEach(m => allGroupMemberIds.add(String(m)));
            if (g.creatorId) allGroupMemberIds.add(String(g.creatorId));
        });
        const memberList = Array.from(allGroupMemberIds);

        const expenses = await Expense.find({
            $or: [
                { creatorId: userId },
                { payerId: userId },
                { payeeId: userId },
                { 'splitDetails.userId': userId },
                { groupId: { $in: groupIds } },
                // Visibility: Settlements between people who both share a group with the current user
                {
                    type: 'settlement',
                    $and: [
                        { payerId: { $in: memberList } },
                        { payeeId: { $in: memberList } }
                    ]
                }
            ]
        }).sort({ date: -1 });

        res.json(expenses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a new expense
router.post('/', async (req, res) => {
    const expenseData = req.body;
    // Map userId to creatorId if necessary (for compatibility)
    if (expenseData.userId && !expenseData.creatorId) {
        expenseData.creatorId = expenseData.userId;
    }

    const expense = new Expense(expenseData);
    try {
        const newExpense = await expense.save();

        // Notify all involved users
        const affectedIds = [
            String(newExpense.creatorId),
            String(newExpense.payerId),
            newExpense.payeeId ? String(newExpense.payeeId) : null,
            ...(newExpense.splitDetails?.map(s => String(s.userId)) || [])
        ];

        if (newExpense.groupId) {
            const group = await Group.findById(newExpense.groupId);
            if (group) {
                affectedIds.push(...group.members.map(m => String(m)));
                if (group.creatorId) affectedIds.push(String(group.creatorId));
            }
        } else if (newExpense.type === 'settlement') {
            // Private settlement between A and B should be visible to any user C 
            // who is in a group with BOTH A and B.
            const payerGroups = await Group.find({ members: newExpense.payerId }).select('_id members creatorId');
            const payeeGroups = await Group.find({ members: newExpense.payeeId }).select('_id members creatorId');

            const payerGroupIds = new Set(payerGroups.map(g => String(g._id)));
            const sharedGroups = payeeGroups.filter(g => payerGroupIds.has(String(g._id)));

            sharedGroups.forEach(group => {
                affectedIds.push(...group.members.map(m => String(m)));
                if (group.creatorId) affectedIds.push(String(group.creatorId));
            });
        }

        const affectedUsers = new Set(affectedIds.filter(Boolean));
        const userList = Array.from(affectedUsers);
        console.log(`[ADD] Notifying ${userList.length} users: ${userList.join(', ')}`);

        const actor = await User.findOne({ firebaseId: newExpense.creatorId });
        const actorName = actor ? actor.name : 'Someone';

        userList.forEach(async (userId) => {
            req.io.to(userId).emit('data_updated', { type: 'expense_added', data: newExpense });

            // Log Activity
            await new Activity({
                userId,
                actorId: newExpense.creatorId,
                actorName,
                type: 'expense_added',
                description: `${actorName} added "${newExpense.description}"`,
                metadata: {
                    expenseId: newExpense._id,
                    amount: newExpense.amount,
                    expenseDescription: newExpense.description
                }
            }).save();
        });

        res.status(201).json(newExpense);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update an expense
router.put('/:id', async (req, res) => {
    try {
        const oldExpense = await Expense.findById(req.params.id);
        if (!oldExpense) return res.status(404).json({ message: 'Expense not found' });

        const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });

        const affectedIds = [
            String(oldExpense.creatorId),
            String(oldExpense.payerId),
            oldExpense.payeeId ? String(oldExpense.payeeId) : null,
            ...(oldExpense.splitDetails?.map(s => String(s.userId)) || []),
            String(updatedExpense.creatorId),
            String(updatedExpense.payerId),
            updatedExpense.payeeId ? String(updatedExpense.payeeId) : null,
            ...(updatedExpense.splitDetails?.map(s => String(s.userId)) || [])
        ];

        if (updatedExpense.groupId) {
            const group = await Group.findById(updatedExpense.groupId);
            if (group) {
                affectedIds.push(...group.members.map(m => String(m)));
                if (group.creatorId) affectedIds.push(String(group.creatorId));
            }
        }

        if (oldExpense.groupId && String(oldExpense.groupId) !== String(updatedExpense.groupId)) {
            const oldGroup = await Group.findById(oldExpense.groupId);
            if (oldGroup) {
                affectedIds.push(...oldGroup.members.map(m => String(m)));
                if (oldGroup.creatorId) affectedIds.push(String(oldGroup.creatorId));
            }
        }

        const affectedUsers = new Set(affectedIds.filter(Boolean));
        const userList = Array.from(affectedUsers);
        console.log(`[UPDATE] Notifying ${userList.length} users: ${userList.join(', ')}`);

        const actor = await User.findOne({ firebaseId: updatedExpense.creatorId }); // Assuming creator or editor
        const actorName = actor ? actor.name : 'Someone';

        userList.forEach(async (userId) => {
            req.io.to(userId).emit('data_updated', { type: 'expense_updated', data: updatedExpense });

            // Log Activity
            await new Activity({
                userId,
                actorId: updatedExpense.creatorId,
                actorName,
                type: 'expense_updated',
                description: `${actorName} updated "${updatedExpense.description}"`,
                metadata: {
                    expenseId: updatedExpense._id,
                    amount: updatedExpense.amount,
                    oldAmount: oldExpense.amount,
                    expenseDescription: updatedExpense.description
                }
            }).save();
        });

        res.json(updatedExpense);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete an expense
router.delete('/:id', async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (expense) {
            const affectedIds = [
                String(expense.creatorId),
                String(expense.payerId),
                expense.payeeId ? String(expense.payeeId) : null,
                ...(expense.splitDetails?.map(s => String(s.userId)) || [])
            ];

            if (expense.groupId) {
                const group = await Group.findById(expense.groupId);
                if (group) {
                    affectedIds.push(...group.members.map(m => String(m)));
                    if (group.creatorId) affectedIds.push(String(group.creatorId));
                }
            }

            const affectedUsers = new Set(affectedIds.filter(Boolean));

            await Expense.findByIdAndDelete(req.params.id);

            const actor = await User.findOne({ firebaseId: expense.creatorId });
            const actorName = actor ? actor.name : 'Someone';

            affectedUsers.forEach(async (userId) => {
                console.log(`Notifying user ${userId} of deleted expense`);
                req.io.to(userId).emit('data_updated', { type: 'expense_deleted', id: req.params.id });

                // Log Activity
                await new Activity({
                    userId,
                    actorId: expense.creatorId,
                    actorName,
                    type: 'expense_deleted',
                    description: `${actorName} deleted expense "${expense.description}"`,
                    metadata: {
                        amount: expense.amount,
                        expenseDescription: expense.description
                    }
                }).save();
            });
        }
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
