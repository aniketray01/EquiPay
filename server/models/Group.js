import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    creatorId: { type: String, required: true }, // The Firebase UID of the person who created this group
    name: { type: String, required: true },
    type: { type: String, default: 'Trip' },
    members: [String] // Array of Firebase UIDs
}, { timestamps: true });

groupSchema.index({ members: 1 });
groupSchema.index({ creatorId: 1 });

export default mongoose.model('Group', groupSchema);
