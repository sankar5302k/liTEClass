import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
    code: string;
    hostId: string;
    active: boolean;
    participants: string[];
    createdAt: Date;
}

const RoomSchema: Schema = new Schema({
    code: { type: String, required: true, unique: true },
    hostId: { type: String, required: true }, // This will be the host's email
    active: { type: Boolean, default: true },
    participants: { type: [String], default: [] }, // Array of emails
    createdAt: { type: Date, default: Date.now, expires: '24h' },
});

export default mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);