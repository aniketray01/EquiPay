import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    creatorId: { type: String, required: true }, // The Firebase UID of the person who created this expense
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    payerId: { type: String, required: true },
    payeeId: { type: String, default: null }, // Only for settlements
    date: { type: Date, default: Date.now },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    type: { type: String, default: 'expense' }, // 'expense' or 'settlement'
    selectedFriends: [String], // Array of friend IDs (Firebase UIDs)
    splitDetails: [{
        userId: String,
        amount: Number
    }]
}, { timestamps: true });

expenseSchema.index({ creatorId: 1 });
expenseSchema.index({ payerId: 1 });
expenseSchema.index({ payeeId: 1 });
expenseSchema.index({ 'splitDetails.userId': 1 });

export default mongoose.model('Expense', expenseSchema);
