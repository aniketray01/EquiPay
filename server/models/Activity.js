import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    userId: { type: String, required: true }, // The user who this activity is shown to
    actorId: { type: String, required: true }, // The user who performed the action
    actorName: { type: String, required: true },
    type: {
        type: String,
        enum: ['expense_added', 'expense_updated', 'expense_deleted', 'group_created', 'group_deleted', 'member_added', 'friend_added'],
        required: true
    },
    description: { type: String, required: true },
    metadata: {
        expenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
        groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
        friendId: { type: String },
        amount: { type: Number },
        oldAmount: { type: Number },
        expenseDescription: { type: String }
    },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

activitySchema.index({ userId: 1, date: -1 });

export default mongoose.model('Activity', activitySchema);
