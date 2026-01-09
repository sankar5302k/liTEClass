import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
    code: string;
    hostId: string;
    active: boolean;
    participants: string[];
    waitingRoom: string[];
    whiteboardAccess: string[];
    createdAt: Date;
}

const RoomSchema: Schema = new Schema({
    code: { type: String, required: true, unique: true },
    hostId: { type: String, required: true },
    active: { type: Boolean, default: true },
    participants: { type: [String], default: [] },
    waitingRoom: { type: [String], default: [] },
    whiteboardAccess: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now, expires: '24h' },
});

export default mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);