import mongoose from 'mongoose';

const PollSchema = new mongoose.Schema({
    roomId: { type: String, required: true, index: true },
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    votes: [{
        userId: { type: String, required: true },
        optionIndex: { type: Number, required: true } // 0-based index of the selected option
    }],
    duration: { type: Number, required: true }, // Duration in seconds
    correctOptionIndex: { type: Number, required: false }, // Optional for backward compatibility, but we will use it
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Poll || mongoose.model('Poll', PollSchema);
