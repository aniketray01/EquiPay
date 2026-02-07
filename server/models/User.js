import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firebaseId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String }
}, { timestamps: true });

userSchema.index({ name: 1 });

export default mongoose.model('User', userSchema);
