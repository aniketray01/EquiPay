import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // The Firebase UID who added the friend
    friendId: { type: String, required: true }, // Unique ID for the friend
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true }
}, { timestamps: true });

friendSchema.index({ userId: 1 });
friendSchema.index({ friendId: 1 });
friendSchema.index({ email: 1 });

export default mongoose.model('Friend', friendSchema);
