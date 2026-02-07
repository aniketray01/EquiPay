import express from 'express';
import Expense from '../models/Expense.js';

const router = express.Router();

// Get all expenses for a user (either as creator, payer, or participant)
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const expenses = await Expense.find({
            $or: [
                { creatorId: userId },
                { payerId: userId },
                { payeeId: userId },
                { 'splitDetails.userId': userId }
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
        const affectedUsers = new Set([
            newExpense.creatorId,
            newExpense.payerId,
            newExpense.payeeId,
            ...(newExpense.splitDetails?.map(s => s.userId) || [])
        ].filter(Boolean));

        affectedUsers.forEach(userId => {
            req.io.to(userId).emit('data_updated', { type: 'expense_added', data: newExpense });
        });

        res.status(201).json(newExpense);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete an expense
router.delete('/:id', async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (expense) {
            const affectedUsers = new Set([
                expense.creatorId,
                expense.payerId,
                expense.payeeId,
                ...(expense.splitDetails?.map(s => s.userId) || [])
            ].filter(Boolean));

            await Expense.findByIdAndDelete(req.params.id);

            affectedUsers.forEach(userId => {
                req.io.to(userId).emit('data_updated', { type: 'expense_deleted', id: req.params.id });
            });
        }
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
